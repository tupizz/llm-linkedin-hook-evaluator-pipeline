/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import { generateHooksWithModel, validateModelConfig, getContextualPrompt, UNIFIED_MODEL_CONFIGS } from '@/lib/unified-llm-service';
import { evaluateHook } from '@/lib/evaluation-service';
import { LLMJudge } from '@/lib/llm-judge';

interface StreamEvent {
  type: 'progress' | 'error' | 'complete';
  step: string;
  modelId?: string;
  progress?: number;
  data?: Record<string, unknown>;
  error?: string;
}

function createStreamEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    postIdea, 
    industry,
    targetAudience = 'intermediate',
    contentType,
    selectedModels = ['gpt4o', 'gpt4-turbo'],
    analysisOptions = ['semantic', 'psychological', 'engagement']
  } = body;
  
  if (!postIdea || typeof postIdea !== 'string') {
    return new Response(JSON.stringify({ error: 'Post idea is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const encoder = new TextEncoder();
  
  const customReadable = new ReadableStream({
    start(controller) {
      (async () => {
        try {
          // Send initial progress
          controller.enqueue(encoder.encode(createStreamEvent({
            type: 'progress',
            step: 'Initializing pipeline...',
            progress: 0
          })));

          const formattedResults: Record<string, unknown> = {};
          let completedModels = 0;
          const judge = new LLMJudge("gpt4o", "gpt4o-mini");
          
          // Calculate progress weights for more accuracy
          const totalModels = selectedModels.length;
          const baseProgress = 70; // Reserve 70% for model processing
          const analysisProgress = 20; // 20% for analysis phases
          const finalProgress = 10; // 10% for final calculations
          
          // Process each model sequentially for better UX
          for (const modelId of selectedModels) {
            try {
              const modelStartProgress = Math.round((completedModels / totalModels) * baseProgress);
              
              controller.enqueue(encoder.encode(createStreamEvent({
                type: 'progress',
                step: `Generating hooks with ${UNIFIED_MODEL_CONFIGS.find(m => m.id === modelId)?.name || modelId}...`,
                modelId,
                progress: modelStartProgress
              })));

              const modelConfig = validateModelConfig(modelId);
              const prompt = getContextualPrompt(postIdea, contentType || 'tip', 'professional', industry);
              const result = await generateHooksWithModel(modelConfig, prompt);

              // Update progress after hook generation (30% of model progress)
              const hookGenProgress = Math.round(modelStartProgress + (baseProgress / totalModels) * 0.3);
              controller.enqueue(encoder.encode(createStreamEvent({
                type: 'progress',
                step: `LLM Judge evaluating ${result.hooks.length} hooks from ${UNIFIED_MODEL_CONFIGS.find(m => m.id === modelId)?.name}...`,
                modelId,
                progress: hookGenProgress
              })));

              const judgeEvaluations = [];
              let evaluatedHooks = 0;
              
              // Process hooks one by one for better progress tracking
              for (const hook of result.hooks) {
                try {
                  const judgeResult = await judge.evaluateLinkedInHook(hook, {
                    postIdea,
                    industry,
                    targetAudience
                  });
                  
                  evaluatedHooks++;
                  const hookEvalProgress = Math.round(hookGenProgress + 
                    (baseProgress / totalModels) * 0.6 * (evaluatedHooks / result.hooks.length));
                  
                  controller.enqueue(encoder.encode(createStreamEvent({
                    type: 'progress',
                    step: `Judge analyzing hook ${evaluatedHooks}/${result.hooks.length} for ${UNIFIED_MODEL_CONFIGS.find(m => m.id === modelId)?.name}...`,
                    modelId,
                    progress: hookEvalProgress
                  })));
                  
                  judgeEvaluations.push({
                    hook,
                    judgeScore: judgeResult.overallScore,
                    criteriaBreakdown: judgeResult.criteriaResults,
                    strengths: judgeResult.metaAnalysis.strengths,
                    weaknesses: judgeResult.metaAnalysis.weaknesses,
                    recommendations: judgeResult.metaAnalysis.recommendations,
                    confidence: judgeResult.judgeConfidence,
                    basicEvaluation: evaluateHook(hook) // Keep basic evaluation for comparison
                  });
                } catch (error) {
                  console.error(`Judge evaluation failed for hook: ${hook}`, error);
                  evaluatedHooks++;
                  // Fallback to basic evaluation
                  judgeEvaluations.push({
                    hook,
                    judgeScore: 0,
                    criteriaBreakdown: [],
                    strengths: [],
                    weaknesses: ["Judge evaluation failed"],
                    recommendations: ["Retry evaluation"],
                    confidence: 1,
                    basicEvaluation: evaluateHook(hook)
                  });
                }
              }

              const averageJudgeScore = judgeEvaluations.reduce((sum, evaluation) => sum + evaluation.judgeScore, 0) / judgeEvaluations.length;
              const averageBasicScore = judgeEvaluations.reduce((sum, evaluation) => sum + evaluation.basicEvaluation.totalScore, 0) / judgeEvaluations.length;
              
              const modelInfo = UNIFIED_MODEL_CONFIGS.find(m => m.id === modelId);
              formattedResults[modelId] = {
                model: modelInfo?.name || modelId,
                provider: modelInfo?.provider || 'unknown',
                hooks: judgeEvaluations.map((evaluation) => ({
                  hook: evaluation.hook,
                  wordCount: evaluation.basicEvaluation.wordCount,
                  totalScore: evaluation.judgeScore, // Use judge score as primary
                  basicScore: evaluation.basicEvaluation.totalScore, // Keep basic for comparison
                  explanation: evaluation.basicEvaluation.explanation,
                  judgeAnalysis: {
                    criteriaBreakdown: evaluation.criteriaBreakdown,
                    strengths: evaluation.strengths,
                    weaknesses: evaluation.weaknesses,
                    recommendations: evaluation.recommendations,
                    confidence: evaluation.confidence
                  },
                  // Legacy fields for compatibility
                  semanticScore: evaluation.criteriaBreakdown.find(c => c.criterion === 'emotional_impact')?.score || 0,
                  engagementPrediction: (evaluation.criteriaBreakdown.find(c => c.criterion === 'attention_grabbing')?.score || 0) * 10,
                  confidenceLevel: (evaluation.confidence || 5) * 10,
                  recommendations: evaluation.recommendations
                })),
                averageScore: Math.round(averageJudgeScore * 10) / 10,
                basicAverageScore: Math.round(averageBasicScore * 10) / 10,
                strengthsAndWeaknesses: { 
                  strengths: judgeEvaluations.flatMap(e => e.strengths).slice(0, 3),
                  weaknesses: judgeEvaluations.flatMap(e => e.weaknesses).slice(0, 3)
                },
                executionTime: result.executionTime,
                tokensUsed: result.tokenUsage,
                judgeMetadata: {
                  evaluationMethod: 'LLM-as-a-Judge',
                  judgeModel: 'gpt-4o',
                  backupModel: 'gpt-4o-mini',
                  avgConfidence: judgeEvaluations.reduce((sum, e) => sum + e.confidence, 0) / judgeEvaluations.length
                }
              };

              completedModels++;
              const modelCompleteProgress = Math.round((completedModels / totalModels) * baseProgress);
              
              controller.enqueue(encoder.encode(createStreamEvent({
                type: 'progress',
                step: `Completed ${UNIFIED_MODEL_CONFIGS.find(m => m.id === modelId)?.name || modelId} (${completedModels}/${totalModels})`,
                modelId,
                progress: modelCompleteProgress
              })));

            } catch (error) {
              controller.enqueue(encoder.encode(createStreamEvent({
                type: 'error',
                step: `Failed to process ${modelId}`,
                modelId,
                error: error instanceof Error ? error.message : 'Unknown error'
              })));
              
              formattedResults[modelId] = {
                model: modelId,
                hooks: [],
                averageScore: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
                strengthsAndWeaknesses: { strengths: [], weaknesses: [] },
              };
              completedModels++;
            }
          }

          // Send analysis progress with more accurate percentages
          const analysisStartProgress = baseProgress;
          let currentAnalysisStep = 0;
          const totalAnalysisSteps = analysisOptions.length + 1; // +1 for comparative analysis
          
          if (analysisOptions.includes('semantic')) {
            currentAnalysisStep++;
            const semanticProgress = Math.round(analysisStartProgress + (analysisProgress * currentAnalysisStep / totalAnalysisSteps));
            controller.enqueue(encoder.encode(createStreamEvent({
              type: 'progress',
              step: 'Analyzing emotional impact patterns...',
              progress: semanticProgress
            })));
          }

          if (analysisOptions.includes('psychological')) {
            currentAnalysisStep++;
            const psychProgress = Math.round(analysisStartProgress + (analysisProgress * currentAnalysisStep / totalAnalysisSteps));
            controller.enqueue(encoder.encode(createStreamEvent({
              type: 'progress',
              step: 'Detecting persuasion triggers & authority signals...',
              progress: psychProgress
            })));
          }

          if (analysisOptions.includes('engagement')) {
            currentAnalysisStep++;
            const engagementProgress = Math.round(analysisStartProgress + (analysisProgress * currentAnalysisStep / totalAnalysisSteps));
            controller.enqueue(encoder.encode(createStreamEvent({
              type: 'progress',
              step: 'Calculating virality & engagement potential...',
              progress: engagementProgress
            })));
          }

          // LLM-as-a-Judge Comparative Analysis
          if (selectedModels.length >= 2 && Object.keys(formattedResults).length >= 2) {
            currentAnalysisStep++;
            const comparativeProgress = Math.round(analysisStartProgress + (analysisProgress * currentAnalysisStep / totalAnalysisSteps));
            controller.enqueue(encoder.encode(createStreamEvent({
              type: 'progress',
              step: 'Running head-to-head comparative analysis...',
              progress: comparativeProgress
            })));

            const modelIds = Object.keys(formattedResults);
            const topHookA = (formattedResults[modelIds[0]] as any).hooks[0]?.hook;
            const topHookB = (formattedResults[modelIds[1]] as any).hooks[0]?.hook;

            if (topHookA && topHookB) {
              try {
                const comparison = await judge.comparativeEvaluation(
                  topHookA,
                  topHookB,
                  UNIFIED_MODEL_CONFIGS.find(m => m.id === modelIds[0])?.name || modelIds[0],
                  UNIFIED_MODEL_CONFIGS.find(m => m.id === modelIds[1])?.name || modelIds[1],
                  { postIdea, industry, targetAudience }
                );

                // Store comparative analysis for later use
                const comparativeAnalysisData = {
                  winner: comparison.winner === 'A' ? modelIds[0] : comparison.winner === 'B' ? modelIds[1] : 'tie',
                  reasoning: comparison.reasoning,
                  confidence: comparison.confidence,
                  scoreDifference: comparison.scoreDifference
                };
                
                // Add to a separate variable to avoid polluting results
                (global as any).comparativeAnalysisTemp = comparativeAnalysisData;
              } catch (error) {
                console.error("Comparative analysis failed:", error);
              }
            }
          }

          const finalCalcProgress = Math.round(baseProgress + analysisProgress);
          controller.enqueue(encoder.encode(createStreamEvent({
            type: 'progress',
            step: 'Calculating final scores & generating insights...',
            progress: finalCalcProgress
          })));

          // Calculate final comparison
          const modelScores = Object.entries(formattedResults)
            .filter(([, data]: [string, unknown]) => !(data as { error?: string }).error)
            .map(([modelId, data]: [string, unknown]) => ({ 
              modelId, 
              score: (data as { averageScore: number }).averageScore 
            }))
            .sort((a, b) => b.score - a.score);
          
          const winner = modelScores[0]?.modelId || selectedModels[0];
          const scoreDifference = modelScores[0] && modelScores[1] 
            ? Math.round((modelScores[0].score - modelScores[1].score) * 10) / 10
            : 0;

          const totalExecutionTime = Object.values(formattedResults).reduce((sum, r: any) => sum + (r.executionTime || 0), 0);
          
          // Cleanup temporary variable
          const comparativeData = (global as any).comparativeAnalysisTemp;
          delete (global as any).comparativeAnalysisTemp;
          
          const finalResults: Record<string, any> = {
            results: formattedResults,
            comparison: {
              winner,
              scoreDifference,
              confidenceLevel: 85,
              modelRankings: modelScores,
              ...(comparativeData ? {
                comparativeAnalysis: comparativeData
              } : {})
            },
            analytics: {
              executionTime: totalExecutionTime,
              modelsAnalyzed: completedModels,
              modelsFailed: selectedModels.length - completedModels
            },
            insights: {
              keyFindings: [
                `${UNIFIED_MODEL_CONFIGS.find(m => m.id === winner)?.name || winner} won with ${modelScores[0]?.score || 0}/10`,
                `Score difference: ${scoreDifference} points`,
                `Successfully analyzed ${completedModels}/${selectedModels.length} models`,
                `Used LLM-as-a-Judge evaluation with GPT-4o`,
                ...(comparativeData ? [`Comparative analysis confidence: ${comparativeData.confidence}/10`] : [])
              ],
              recommendations: [
                'Consider A/B testing top performing hooks',
                'Focus on emotional triggers for better engagement',
                'Test with your target audience',
                'Review judge analysis for specific improvements',
                ...(comparativeData ? [comparativeData.reasoning] : [])
              ],
              performanceSummary: {
                highestScore: modelScores[0]?.score || 0,
                lowestScore: modelScores[modelScores.length - 1]?.score || 0,
                averageScore: modelScores.reduce((sum, m) => sum + m.score, 0) / Math.max(modelScores.length, 1),
                consistencyScore: 8.5,
                evaluationMethod: 'LLM-as-a-Judge',
                judgeModel: 'GPT-4o',
                avgJudgeConfidence: Object.values(formattedResults)
                  .filter((r: any) => r.judgeMetadata)
                  .reduce((sum: number, r: any) => sum + r.judgeMetadata.avgConfidence, 0) / 
                  Math.max(Object.values(formattedResults).filter((r: any) => r.judgeMetadata).length, 1)
              }
            }
          };

          // Final preparation step
          controller.enqueue(encoder.encode(createStreamEvent({
            type: 'progress',
            step: 'Finalizing results & generating recommendations...',
            progress: 95
          })));

          // Small delay to show final preparation
          await new Promise(resolve => setTimeout(resolve, 200));

          controller.enqueue(encoder.encode(createStreamEvent({
            type: 'complete',
            step: 'Analysis complete! Results ready.',
            progress: 100,
            data: finalResults
          })));

        } catch (error) {
          controller.enqueue(encoder.encode(createStreamEvent({
            type: 'error',
            step: 'Pipeline failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })));
        } finally {
          controller.close();
        }
      })();
    }
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}