import { generateObject, generateText } from "ai";
import { z } from "zod";
import { getModelProvider, validateModelConfig } from "./unified-llm-service";

// Zod schemas for structured output
const judgeResultSchema = z.object({
  criterion: z.string(),
  score: z.number(),
  reasoning: z.string(),
  confidence: z.number(),
});

const comprehensiveJudgeResultSchema = z.object({
  criteriaResults: z.array(judgeResultSchema),
  overallScore: z.number(),
  metaAnalysis: z.object({
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
  judgeConfidence: z.number(),
});

const comparativeResultSchema = z.object({
  winner: z.enum(["A", "B", "tie"]),
  confidence: z.number(),
  reasoning: z.string(),
  keyAdvantage: z.string().optional(),
});

const validationResultSchema = z.object({
  appropriateScoring: z.boolean(),
  consistentWithCriteria: z.boolean(),
  coherentReasoning: z.boolean(),
  explanation: z.string().optional(),
});

export interface JudgeEvaluationCriteria {
  criterion: string;
  description: string;
  weight: number;
  scale: "binary" | "score_1_10" | "score_1_5";
  examples?: {
    excellent: string[];
    poor: string[];
  };
}

export interface JudgeResult {
  criterion: string;
  score: number;
  reasoning: string;
  confidence: number;
  examples?: string[];
}

export interface ComprehensiveJudgeResult {
  overallScore: number;
  criteriaResults: JudgeResult[];
  metaAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  judgeConfidence: number;
  validationFlags: {
    coherentReasoning: boolean;
    appropriateScoring: boolean;
    consistentWithCriteria: boolean;
  };
}

export class LLMJudge {
  private judgeModelId: string;
  private backupModelId: string;

  constructor(
    judgeModel: string = "gpt4o",
    backupModel: string = "gpt4o-mini"
  ) {
    this.judgeModelId = judgeModel;
    this.backupModelId = backupModel;
  }

  /**
   * Core LLM-as-a-Judge evaluation with comprehensive criteria
   */
  async evaluateWithJudge(
    content: string,
    criteria: JudgeEvaluationCriteria[],
    context: {
      task: string;
      industry?: string;
      targetAudience?: string;
      contentType?: string;
    }
  ): Promise<ComprehensiveJudgeResult> {
    try {
      const evaluationPrompt = this.buildJudgePrompt(
        content,
        criteria,
        context
      );

      // Primary evaluation with main judge model
      const primaryResult = await this.callJudgeModel(
        evaluationPrompt,
        this.judgeModelId
      );

      // Validation check with backup model for quality assurance
      const validationResult = await this.validateJudgeResult(
        content,
        primaryResult,
        criteria
      );

      return {
        ...primaryResult,
        validationFlags: validationResult,
        judgeConfidence: this.calculateJudgeConfidence(
          primaryResult,
          validationResult
        ),
      };
    } catch (error) {
      console.error("Judge evaluation failed:", error);
      // Fallback to backup model
      return this.fallbackEvaluation(content, criteria, context);
    }
  }

  /**
   * LinkedIn Hook specific judge evaluation
   * @TODO -> extract real data from good and bad examples from linkedin posts with more reactions and comments (good examples) and the ones without (bad examples)
   */
  async evaluateLinkedInHook(
    hook: string,
    context: {
      postIdea: string;
      industry?: string;
      targetAudience?: string;
    }
  ): Promise<ComprehensiveJudgeResult> {
    const linkedInCriteria: JudgeEvaluationCriteria[] = [
      {
        criterion: "attention_grabbing",
        description:
          "Does the hook immediately capture attention and create curiosity? (Maps to Charisma)",
        weight: 0.25,
        scale: "score_1_10",
        examples: {
          excellent: [
            "I made $50K in 30 days using this LinkedIn strategy nobody talks about",
            "My biggest client ghosted me. Here's what I learned about follow-ups.",
            "The email that got me fired also got me my dream job",
          ],
          poor: [
            "Here are some LinkedIn tips and best practices for professionals",
            "Let's dive deep into the importance of networking in today's digital landscape",
            "Thrilled to share some insights on business growth and thought leadership",
          ],
        },
      },
      {
        criterion: "emotional_impact",
        description:
          "Does the hook trigger strong emotional responses (surprise, curiosity, fear, excitement)? (Maps to Empathy)",
        weight: 0.2,
        scale: "score_1_10",
        examples: {
          excellent: [
            "The mistake that cost me $100K in my first startup",
            "I was 2 weeks away from bankruptcy when this happened",
            "My boss said I'd never succeed. I just bought his company.",
          ],
          poor: [
            "Starting a business can be challenging but rewarding in the long run",
            "Let's explore some key considerations for professional development",
            "Excited to share some valuable learnings from my journey in the industry",
          ],
        },
      },
      {
        criterion: "social_proof",
        description:
          "Does it leverage authority, credibility, or social validation? (Maps to Authority)",
        weight: 0.15,
        scale: "score_1_10",
        examples: {
          excellent: [
            "After 10 years as a Google PM, here's what I learned about product launches",
            "Used by 500+ Fortune 500 companies, this framework changed everything",
            "The strategy that helped me scale 3 startups to 8-figure exits",
          ],
          poor: [
            "I think this approach might work based on my limited experience",
            "Passionate about leveraging synergistic solutions for optimal outcomes",
            "As someone who's been in the space for a while, let me share my thoughts",
          ],
        },
      },
      {
        criterion: "clarity_and_brevity",
        description:
          "Is the message clear, concise, and easy to understand? (Maps to Wisdom)",
        weight: 0.15,
        scale: "score_1_10",
        examples: {
          excellent: [
            "3 LinkedIn hacks that doubled my reach in 30 days",
            "The 60-second rule that saves me 10 hours per week",
            "One question that closes 80% of my sales calls",
          ],
          poor: [
            "Various methodologies and multifaceted approaches I've discovered through extensive research and analysis",
            "Leveraging cutting-edge paradigms to optimize cross-functional synergies and scalable solutions",
            "Deep dive into the complexities of modern business ecosystems and their interconnected dynamics",
          ],
        },
      },
      {
        criterion: "relevance_to_audience",
        description:
          "Is it relevant to the target LinkedIn professional audience? (Maps to Insight)",
        weight: 0.15,
        scale: "score_1_10",
        examples: {
          excellent: [
            "How I automated my B2B sales pipeline using free tools",
            "The Zoom meeting mistake that's costing you promotions",
            "Why your LinkedIn DMs aren't converting (and how to fix it)",
          ],
          poor: [
            "My weekend cooking adventures and what they taught me about life",
            "Grateful for my morning coffee and the energy it brings to my day",
            "Just finished an amazing workout session at the gym this morning",
          ],
        },
      },
      {
        criterion: "actionability_promise",
        description:
          "Does it promise actionable insights or valuable information? (Maps to Power)",
        weight: 0.1,
        scale: "score_1_10",
        examples: {
          excellent: [
            "The 5-step process I use to close enterprise deals in 30 days",
            "Steal my exact email template that gets 40% response rates",
            "Copy-paste scripts that turned cold prospects into $1M+ clients",
          ],
          poor: [
            "Some thoughts on business strategy and market dynamics",
            "Reflections on the evolving landscape of professional development",
            "Musings about the future of work and organizational transformation",
          ],
        },
      },
    ];

    return this.evaluateWithJudge(hook, linkedInCriteria, {
      task: "LinkedIn Hook Evaluation",
      industry: context.industry,
      targetAudience: context.targetAudience,
      contentType: "social_media_hook",
    });
  }

  /**
   * Comparative evaluation between two pieces of content
   */
  async comparativeEvaluation(
    contentA: string,
    contentB: string,
    modelNameA: string,
    modelNameB: string,
    context: any
  ): Promise<{
    winner: "A" | "B" | "tie";
    scoreDifference: number;
    reasoning: string;
    confidence: number;
    detailedScores: {
      A: ComprehensiveJudgeResult;
      B: ComprehensiveJudgeResult;
    };
  }> {
    // Evaluate both pieces of content
    const [resultA, resultB] = await Promise.all([
      this.evaluateLinkedInHook(contentA, context),
      this.evaluateLinkedInHook(contentB, context),
    ]);

    // Comparative analysis prompt
    const comparePrompt = `
As an expert LinkedIn content evaluator, compare these two hooks:

Hook A (${modelNameA}): "${contentA}"
Hook B (${modelNameB}): "${contentB}"

Context: ${context.postIdea}
Target: ${context.targetAudience} professionals in ${context.industry}

SCORES:
Hook A: ${resultA.overallScore}/10
Hook B: ${resultB.overallScore}/10

Based on the scores and your expertise, determine:
1. Which hook is better overall?
2. What's the key differentiator?
3. How confident are you in this assessment?

Your response will be automatically structured as JSON.
`;

    try {
      const modelConfig = validateModelConfig(this.judgeModelId);
      const model = getModelProvider(modelConfig);

      const result = await generateObject({
        model,
        messages: [{ role: "user", content: comparePrompt }],
        schema: comparativeResultSchema,
        temperature: 0.1,
      });

      const comparison = result.object;

      const scoreDifference = Math.abs(
        resultA.overallScore - resultB.overallScore
      );

      return {
        winner: comparison.winner,
        scoreDifference,
        reasoning: comparison.reasoning,
        confidence: comparison.confidence,
        detailedScores: {
          A: resultA,
          B: resultB,
        },
      };
    } catch (error) {
      console.error("Comparative evaluation failed:", error);
      // Fallback to simple score comparison
      const scoreDifference = Math.abs(
        resultA.overallScore - resultB.overallScore
      );
      return {
        winner:
          resultA.overallScore > resultB.overallScore
            ? "A"
            : resultB.overallScore > resultA.overallScore
            ? "B"
            : "tie",
        scoreDifference,
        reasoning: "Based on individual criterion scores",
        confidence: 7,
        detailedScores: { A: resultA, B: resultB },
      };
    }
  }

  private buildJudgePrompt(
    content: string,
    criteria: JudgeEvaluationCriteria[],
    context: any
  ): string {
    return `You are an expert evaluator for ${
      context.task
    }. Evaluate this content and respond with ONLY a valid JSON object.

CONTENT TO EVALUATE: "${content}"

CONTEXT:
- Task: ${context.task}
- Industry: ${context.industry || "General"}
- Target Audience: ${context.targetAudience || "Professional"}
- Content Type: ${context.contentType || "General"}

EVALUATION CRITERIA:
${criteria
  .map(
    (c, i) => `
${i + 1}. ${c.criterion.toUpperCase()} (Weight: ${(c.weight * 100).toFixed(0)}%)
   Description: ${c.description}
   Scale: ${c.scale}
   ${
     c.examples
       ? `
   EXCELLENT Examples:
   ${c.examples.excellent.map((ex) => `   • "${ex}"`).join("\n")}
   
   POOR Examples (avoid these patterns):
   ${c.examples.poor.map((ex) => `   • "${ex}"`).join("\n")}`
       : ""
   }
`
  )
  .join("")}

RED FLAGS TO PENALIZE HEAVILY (automatic score reduction):
• Corporate jargon: "synergistic", "paradigms", "leverage", "ecosystem", "touch base"
• Vague phrases: "thoughts on", "dive deep", "let's explore", "various methods"
• Overused LinkedIn-speak: "thrilled to share", "excited to announce", "passionate about"
• Generic openings: "here are some tips", "wanted to share", "let me tell you"
• Humble bragging without substance: "blessed", "grateful", "honored" without context

INSTRUCTIONS:
1. Evaluate each criterion independently with specific reasoning
2. Provide a numerical score based on the specified scale  
3. Give your confidence level (1-10) for each evaluation
4. Identify specific strengths and weaknesses
5. Provide actionable recommendations
6. Heavily penalize hooks containing red flag jargon or patterns

Your response will be automatically structured as JSON with the required format.`;
  }

  private async callJudgeModel(
    prompt: string,
    modelId: string
  ): Promise<ComprehensiveJudgeResult> {
    try {
      const modelConfig = validateModelConfig(modelId);
      const model = getModelProvider(modelConfig);

      const result = await generateObject({
        model,
        messages: [{ role: "user", content: prompt }],
        schema: comprehensiveJudgeResultSchema,
        temperature: 0.1,
      });

      return {
        ...result.object,
        validationFlags: {
          coherentReasoning: true,
          appropriateScoring: true,
          consistentWithCriteria: true,
        },
      };
    } catch (error) {
      console.error(`Error with judge model ${modelId}:`, error);
      // Fallback to text generation if structured output fails
      console.log("Falling back to text generation...");
      throw error;
    }
  }

  private parseJudgeResponse(response: string): ComprehensiveJudgeResult {
    try {
      // Clean the response to extract JSON only
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }

      const cleanedResponse = jsonMatch[0];
      const parsed = JSON.parse(cleanedResponse);

      return {
        overallScore: parsed.overallScore || 5,
        criteriaResults: parsed.criteriaResults || [],
        metaAnalysis: {
          strengths: parsed.metaAnalysis?.strengths || [],
          weaknesses: parsed.metaAnalysis?.weaknesses || [],
          recommendations: parsed.metaAnalysis?.recommendations || [],
        },
        judgeConfidence: parsed.judgeConfidence || 5,
        validationFlags: {
          coherentReasoning: true,
          appropriateScoring: true,
          consistentWithCriteria: true,
        },
      };
    } catch (error) {
      console.error("Error parsing judge JSON response:", error);
      console.error("Raw response:", response);

      // Fallback parsing for non-JSON responses
      return this.fallbackParseJudgeResponse(response);
    }
  }

  private fallbackParseJudgeResponse(
    response: string
  ): ComprehensiveJudgeResult {
    // Parse the structured response from the judge
    const criteriaResults: JudgeResult[] = [];
    let overallScore = 0;
    const metaAnalysis = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      recommendations: [] as string[],
    };
    let judgeConfidence = 8;

    try {
      // Extract criterion scores
      const criterionMatches = response.match(
        /CRITERION_SCORES:([\s\S]*?)OVERALL_ANALYSIS:/
      );
      if (criterionMatches) {
        const criteriaSection = criterionMatches[1];
        const lines = criteriaSection.split("\n").filter((line) => line.trim());

        for (const line of lines) {
          const match = line.match(
            /(\w+):\s*(\d+(?:\.\d+)?)\s*\|\s*(.*?)\s*\|\s*(\d+)/
          );
          if (match) {
            criteriaResults.push({
              criterion: match[1],
              score: parseFloat(match[2]),
              reasoning: match[3],
              confidence: parseInt(match[4]),
            });
          }
        }
      }

      // Extract overall score
      const overallMatch = response.match(/OVERALL_SCORE:\s*(\d+(?:\.\d+)?)/);
      if (overallMatch) {
        overallScore = parseFloat(overallMatch[1]);
      }

      // Extract meta analysis
      const strengthsMatch = response.match(
        /STRENGTHS:\s*([\s\S]*?)(?=WEAKNESSES:|$)/
      );
      const weaknessesMatch = response.match(
        /WEAKNESSES:\s*([\s\S]*?)(?=RECOMMENDATIONS:|$)/
      );
      const recommendationsMatch = response.match(
        /RECOMMENDATIONS:\s*([\s\S]*?)(?=OVERALL_SCORE:|$)/
      );

      if (strengthsMatch) {
        metaAnalysis.strengths = strengthsMatch[1]
          .split(/[,\n-]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (weaknessesMatch) {
        metaAnalysis.weaknesses = weaknessesMatch[1]
          .split(/[,\n-]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (recommendationsMatch) {
        metaAnalysis.recommendations = recommendationsMatch[1]
          .split(/[,\n-]/)
          .map((s) => s.trim())
          .filter(Boolean);
      }

      // Extract judge confidence
      const confidenceMatch = response.match(/JUDGE_CONFIDENCE:\s*(\d+)/);
      if (confidenceMatch) {
        judgeConfidence = parseInt(confidenceMatch[1]);
      }
    } catch (error) {
      console.error("Error parsing judge response:", error);
    }

    return {
      overallScore,
      criteriaResults,
      metaAnalysis,
      judgeConfidence,
      validationFlags: {
        coherentReasoning: true,
        appropriateScoring: true,
        consistentWithCriteria: true,
      },
    };
  }

  private async validateJudgeResult(
    content: string,
    result: ComprehensiveJudgeResult,
    criteria: JudgeEvaluationCriteria[]
  ): Promise<{
    coherentReasoning: boolean;
    appropriateScoring: boolean;
    consistentWithCriteria: boolean;
  }> {
    // Quick validation check using backup model with structured output
    const validationPrompt = `As a quality assurance evaluator, validate this LinkedIn hook evaluation:

CONTENT: "${content}"
OVERALL SCORE: ${result.overallScore}/10
STRENGTHS: ${result.metaAnalysis.strengths.join(", ")}
WEAKNESSES: ${result.metaAnalysis.weaknesses.join(", ")}

VALIDATION CRITERIA:
1. Is the overall score (${
      result.overallScore
    }/10) reasonable for this content quality?
2. Do the identified strengths actually match what's present in the content?
3. Is the reasoning coherent and well-justified?

Respond with true/false for each validation check and optionally explain any concerns.`;

    try {
      const modelConfig = validateModelConfig(this.backupModelId);
      const model = getModelProvider(modelConfig);

      const validationResult = await generateObject({
        model,
        messages: [{ role: "user", content: validationPrompt }],
        schema: validationResultSchema,
        temperature: 0.1,
      });

      return {
        appropriateScoring: validationResult.object.appropriateScoring,
        consistentWithCriteria: validationResult.object.consistentWithCriteria,
        coherentReasoning: validationResult.object.coherentReasoning,
      };
    } catch (error) {
      console.error("Validation failed:", error);
      return {
        coherentReasoning: true,
        appropriateScoring: true,
        consistentWithCriteria: true,
      };
    }
  }

  private calculateJudgeConfidence(
    result: ComprehensiveJudgeResult,
    validation: {
      coherentReasoning: boolean;
      appropriateScoring: boolean;
      consistentWithCriteria: boolean;
    }
  ): number {
    let confidence = result.judgeConfidence;

    // Adjust based on validation
    if (!validation.coherentReasoning) confidence -= 2;
    if (!validation.appropriateScoring) confidence -= 2;
    if (!validation.consistentWithCriteria) confidence -= 1;

    return Math.max(1, Math.min(10, confidence));
  }

  private async fallbackEvaluation(
    content: string,
    criteria: JudgeEvaluationCriteria[],
    context: any
  ): Promise<ComprehensiveJudgeResult> {
    // Simple fallback evaluation using backup model
    try {
      const simplePrompt = `Rate this content 1-10: "${content}". Consider: attention-grabbing, clarity, relevance. Just give: SCORE: [number] REASON: [brief reason]`;

      const modelConfig = validateModelConfig(this.backupModelId);
      const model = getModelProvider(modelConfig);

      const response = await generateText({
        model,
        messages: [{ role: "user", content: simplePrompt }],
        temperature: 0.3,
      });

      const result = response.text;
      const scoreMatch = result.match(/SCORE:\s*(\d+)/);
      const reasonMatch = result.match(/REASON:\s*(.*)/);

      return {
        overallScore: scoreMatch ? parseInt(scoreMatch[1]) : 5,
        criteriaResults: [],
        metaAnalysis: {
          strengths: [reasonMatch ? reasonMatch[1] : "Basic evaluation"],
          weaknesses: ["Fallback evaluation used"],
          recommendations: ["Retry with main judge model"],
        },
        judgeConfidence: 5,
        validationFlags: {
          coherentReasoning: false,
          appropriateScoring: false,
          consistentWithCriteria: false,
        },
      };
    } catch (error) {
      console.error("Fallback evaluation failed:", error);
      return {
        overallScore: 5,
        criteriaResults: [],
        metaAnalysis: { strengths: [], weaknesses: [], recommendations: [] },
        judgeConfidence: 1,
        validationFlags: {
          coherentReasoning: false,
          appropriateScoring: false,
          consistentWithCriteria: false,
        },
      };
    }
  }
}
