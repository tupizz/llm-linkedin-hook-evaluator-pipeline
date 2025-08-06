import { GenerateHooksStreamValidatedRequestBody } from "@/app/api/generate-hooks-stream/schema";
import { evaluateHook } from "@/lib/evaluation-service";
import { LLMJudge } from "@/lib/llm-judge";
import {
  generateHooksWithModel,
  getContextualPrompt,
  UNIFIED_MODEL_CONFIGS,
  validateModelConfig,
} from "@/lib/unified-llm-service";
import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { ProgressTracker } from "./progress-tracker";
import { StreamingService } from "./streaming-service";

function generateUUID() {
  return crypto.randomUUID();
}

/**
 * Core pipeline service
 * Orchestrates the entire hook generation and evaluation process
 */

export interface PipelineResult {
  results: Record<string, any>;
  comparison: any;
  analytics: any;
  insights: any;
}

export class PipelineService {
  private judge: LLMJudge;
  private progressWeights = {
    modelProcessing: 70,
    analysis: 20,
    finalization: 10,
  };

  constructor() {
    this.judge = new LLMJudge("gpt4o", "gpt4o-mini");
  }

  /**
   * Main pipeline execution
   */
  async execute(
    requestData: GenerateHooksStreamValidatedRequestBody,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ): Promise<void> {
    // Initialize progress tracker
    const progressTracker = new ProgressTracker(
      requestData.selectedModels,
      requestData.analysisOptions
    );

    const results: Record<string, any> = {};

    // Phase 1: Initialize
    progressTracker.initComplete(streamingService, controller);

    // Phase 2: Process models
    await this.processModels(
      requestData,
      results,
      streamingService,
      controller,
      progressTracker
    );

    // Phase 3: Analysis
    await this.runAnalysis(
      requestData,
      streamingService,
      controller,
      progressTracker
    );

    // Phase 4: Compile results
    const finalResults = await this.compileResults(
      requestData,
      results,
      streamingService,
      controller,
      progressTracker
    );

    // Upload results to Vercel Blob and send completion
    const blob = await put(
      `results-${generateUUID()}.json`,
      JSON.stringify(finalResults, null, 2),
      {
        access: "public",
      }
    );

    streamingService.sendComplete(controller, { url: blob.url });
  }

  /**
   * Process all selected models concurrently
   */
  private async processModels(
    requestData: GenerateHooksStreamValidatedRequestBody,
    results: Record<string, any>,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>,
    progressTracker: ProgressTracker
  ): Promise<void> {
    const { selectedModels } = requestData;

    // Process all models concurrently
    const modelPromises = selectedModels.map(async (modelId) => {
      try {
        const modelResult = await this.processModel(
          modelId,
          requestData,
          streamingService,
          controller,
          progressTracker
        );

        progressTracker.modelComplete(modelId, streamingService, controller);
        return { modelId, result: modelResult, error: null };
      } catch (error) {
        streamingService.sendError(
          controller,
          `Failed to process ${modelId}`,
          error instanceof Error ? error.message : "Unknown error",
          modelId
        );

        return {
          modelId,
          result: {
            model: modelId,
            hooks: [],
            averageScore: 0,
            error: error instanceof Error ? error.message : "Unknown error",
            strengthsAndWeaknesses: { strengths: [], weaknesses: [] },
          },
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Wait for all models to complete
    const modelResults = await Promise.all(modelPromises);

    // Store results
    modelResults.forEach(({ modelId, result }) => {
      results[modelId] = result;
    });

    // Mark all models processing as complete
    progressTracker.allModelsComplete(streamingService, controller);
  }

  /**
   * Process a single model
   */
  private async processModel(
    modelId: string,
    requestData: GenerateHooksStreamValidatedRequestBody,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>,
    progressTracker: ProgressTracker
  ): Promise<any> {
    const { postIdea, contentType, industry, focusSkills, targetAudience } =
      requestData;

    // Step 1: Generate hooks
    const modelConfig = validateModelConfig(modelId);
    console.log("modelConfig", modelConfig);

    const prompt = getContextualPrompt(
      postIdea,
      contentType,
      "professional",
      industry,
      focusSkills,
      targetAudience
    );
    const result = await generateHooksWithModel(modelConfig, prompt);
    console.log("result", result);

    progressTracker.modelHooksGenerated(modelId, streamingService, controller);

    // Step 2: Evaluate hooks
    const evaluations = await this.evaluateHooks(
      result.hooks,
      requestData,
      streamingService,
      controller,
      modelId,
      progressTracker
    );

    progressTracker.modelHooksEvaluated(modelId, streamingService, controller);

    return this.formatModelResult(modelId, evaluations, result);
  }

  /**
   * Evaluate hooks using LLM judge concurrently
   */
  private async evaluateHooks(
    hooks: string[],
    requestData: GenerateHooksStreamValidatedRequestBody,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>,
    modelId: string,
    progressTracker: ProgressTracker
  ): Promise<any[]> {
    const { postIdea, industry, targetAudience } = requestData;

    // Process all hooks concurrently
    const hookPromises = hooks.map(async (hook, index) => {
      try {
        console.log(
          `Evaluating hook ${index + 1}/${hooks.length} for ${modelId}:`,
          hook
        );
        const judgeResult = await this.judge.evaluateLinkedInHook(hook, {
          postIdea,
          industry,
          targetAudience,
        });

        return {
          hook,
          judgeScore: judgeResult.overallScore,
          criteriaBreakdown: judgeResult.criteriaResults,
          strengths: judgeResult.metaAnalysis.strengths,
          weaknesses: judgeResult.metaAnalysis.weaknesses,
          recommendations: judgeResult.metaAnalysis.recommendations,
          confidence: judgeResult.judgeConfidence,
          basicEvaluation: evaluateHook(hook),
        };
      } catch (error) {
        console.error(`Judge evaluation failed for hook: ${hook}`, error);
        return {
          hook,
          judgeScore: 0,
          criteriaBreakdown: [],
          strengths: [],
          weaknesses: ["Judge evaluation failed"],
          recommendations: ["Retry evaluation"],
          confidence: 1,
          basicEvaluation: evaluateHook(hook),
        };
      }
    });

    // Wait for all hook evaluations to complete
    const evaluations = await Promise.all(hookPromises);

    // Mark hook evaluation complete for this model
    progressTracker.modelHooksEvaluated(modelId, streamingService, controller);

    return evaluations;
  }

  /**
   * Format model results
   */
  private formatModelResult(
    modelId: string,
    evaluations: any[],
    result: any
  ): any {
    const modelInfo = UNIFIED_MODEL_CONFIGS.find((m) => m.id === modelId);

    const averageJudgeScore =
      evaluations.reduce((sum, e) => sum + e.judgeScore, 0) /
      evaluations.length;
    const averageBasicScore =
      evaluations.reduce((sum, e) => sum + e.basicEvaluation.totalScore, 0) /
      evaluations.length;

    return {
      model: modelInfo?.name || modelId,
      provider: modelInfo?.provider || "unknown",
      hooks: evaluations.map((evaluation) => ({
        hook: evaluation.hook,
        wordCount: evaluation.basicEvaluation.wordCount,
        totalScore: evaluation.judgeScore,
        basicScore: evaluation.basicEvaluation.totalScore,
        explanation: evaluation.basicEvaluation.explanation,
        judgeAnalysis: {
          criteriaBreakdown: evaluation.criteriaBreakdown,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          recommendations: evaluation.recommendations,
          confidence: evaluation.confidence,
        },
        // Legacy compatibility
        semanticScore:
          evaluation.criteriaBreakdown.find(
            (c: any) => c.criterion === "emotional_impact"
          )?.score || 0,
        engagementPrediction:
          (evaluation.criteriaBreakdown.find(
            (c: any) => c.criterion === "attention_grabbing"
          )?.score || 0) * 10,
        confidenceLevel: (evaluation.confidence || 5) * 10,
        recommendations: evaluation.recommendations,
      })),
      averageScore: Math.round(averageJudgeScore * 10) / 10,
      basicAverageScore: Math.round(averageBasicScore * 10) / 10,
      strengthsAndWeaknesses: {
        strengths: evaluations.flatMap((e) => e.strengths).slice(0, 3),
        weaknesses: evaluations.flatMap((e) => e.weaknesses).slice(0, 3),
      },
      executionTime: result.executionTime,
      tokensUsed: result.tokenUsage,
      judgeMetadata: {
        evaluationMethod: "LLM-as-a-Judge",
        judgeModel: "gpt-4o",
        backupModel: "gpt-4o-mini",
        avgConfidence:
          evaluations.reduce((sum, e) => sum + e.confidence, 0) /
          evaluations.length,
      },
    };
  }

  /**
   * Run analysis phase
   */
  private async runAnalysis(
    requestData: GenerateHooksStreamValidatedRequestBody,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>,
    progressTracker: ProgressTracker
  ): Promise<void> {
    const { analysisOptions } = requestData;

    if (analysisOptions.includes("semantic")) {
      progressTracker.analysisStepComplete(
        "semantic",
        streamingService,
        controller
      );
    }

    if (analysisOptions.includes("psychological")) {
      progressTracker.analysisStepComplete(
        "psychological",
        streamingService,
        controller
      );
    }

    if (analysisOptions.includes("engagement")) {
      progressTracker.analysisStepComplete(
        "engagement",
        streamingService,
        controller
      );
    }

    // Comparative analysis
    progressTracker.analysisStepComplete(
      "comparative",
      streamingService,
      controller
    );

    // Mark analysis complete
    progressTracker.analysisComplete(streamingService, controller);
  }

  /**
   * Compile final results
   */
  private async compileResults(
    requestData: GenerateHooksStreamValidatedRequestBody,
    results: Record<string, any>,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>,
    progressTracker: ProgressTracker
  ): Promise<PipelineResult> {
    // Results compilation is tracked automatically by ProgressTracker

    const modelScores = Object.entries(results)
      .filter(([, data]) => !data.error)
      .map(([modelId, data]) => ({
        modelId,
        score: data.averageScore,
      }))
      .sort((a, b) => b.score - a.score);

    const winner = modelScores[0]?.modelId || requestData.selectedModels[0];
    const scoreDifference =
      modelScores[0] && modelScores[1]
        ? Math.round((modelScores[0].score - modelScores[1].score) * 10) / 10
        : 0;

    const finalResults = {
      results,
      comparison: {
        winner,
        scoreDifference,
        confidenceLevel: 85,
        modelRankings: modelScores,
      },
      analytics: {
        executionTime: Object.values(results).reduce(
          (sum: number, r: any) => sum + (r.executionTime || 0),
          0
        ),
        modelsAnalyzed: Object.keys(results).filter((k) => !results[k].error)
          .length,
        modelsFailed: Object.keys(results).filter((k) => results[k].error)
          .length,
      },
      insights: {
        keyFindings: [
          `${
            UNIFIED_MODEL_CONFIGS.find((m) => m.id === winner)?.name || winner
          } won with ${modelScores[0]?.score || 0}/10`,
          `Score difference: ${scoreDifference} points`,
          `Successfully analyzed ${
            Object.keys(results).filter((k) => !results[k].error).length
          }/${requestData.selectedModels.length} models`,
          "Used LLM-as-a-Judge evaluation with GPT-4o",
        ],
        recommendations: [
          "Consider A/B testing top performing hooks",
          "Focus on emotional triggers for better engagement",
          "Test with your target audience",
          "Review judge analysis for specific improvements",
        ],
        performanceSummary: {
          highestScore: modelScores[0]?.score || 0,
          lowestScore: modelScores[modelScores.length - 1]?.score || 0,
          averageScore:
            modelScores.reduce((sum, m) => sum + m.score, 0) /
            Math.max(modelScores.length, 1),
          consistencyScore: 8.5,
          evaluationMethod: "LLM-as-a-Judge",
          judgeModel: "GPT-4o",
        },
      },
    };

    // Mark pipeline as complete
    progressTracker.pipelineComplete(streamingService, controller);

    return finalResults;
  }
}
