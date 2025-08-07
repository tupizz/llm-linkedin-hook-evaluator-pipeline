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

  constructor(judgeModel: string = "gpt-5", backupModel: string = "gpt-4.1") {
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
      focusSkills?: string[];
    }
  ): Promise<ComprehensiveJudgeResult> {
    // Define base criteria with dynamic weighting based on focus skills
    const { focusSkills = [] } = context;
    const isFocusSkill = (skill: string) => focusSkills.includes(skill);

    // Calculate dynamic weights: focus skills get higher weight, others get proportionally less
    const focusSkillCount = focusSkills.length;
    const focusSkillWeight = focusSkillCount > 0 ? 0.6 / focusSkillCount : 0.3; // 60% split among focus skills
    const regularSkillWeight =
      focusSkillCount > 0 ? 0.4 / (6 - focusSkillCount) : 0.15; // 40% for others

    const linkedInCriteria: JudgeEvaluationCriteria[] = [
      {
        criterion: "attention_grabbing",
        description:
          "Does the hook leverage Information Gap Theory to create curiosity? Look for contrarian statements, incomplete information, or unexpected claims that make people want to know more.",
        weight: isFocusSkill("attention_grabbing")
          ? focusSkillWeight
          : regularSkillWeight,
        scale: "score_1_10",
        examples: {
          excellent: [
            "I made $50K in 30 days using this LinkedIn strategy nobody talks about",
            "My biggest client ghosted me. Here's what I learned about follow-ups.",
            "The email that got me fired also got me my dream job",
            "2025: Let AI be your B2B personal brand manager.",
            "3 data-backed AI tweaks to double B2B profile inquiries.",
            "Stop polishing logos; AI-guided voices win B2B trust now.",
          ],
          poor: [
            "Here are some LinkedIn tips and best practices for professionals",
            "Let's dive deep into the importance of networking in today's digital landscape",
            "Thrilled to share some insights on business growth and thought leadership",
            "Excited to announce my thoughts on leveraging synergistic solutions",
            "Passionate about sharing various methodologies for optimal outcomes",
          ],
        },
      },
      {
        criterion: "emotional_impact",
        description:
          "Does the hook trigger Emotional Contagion via Mirror Neurons? Look for personal stories, relatable emotions, vulnerability, or transformational experiences that create emotional resonance.",
        weight: isFocusSkill("emotional_impact")
          ? focusSkillWeight
          : regularSkillWeight,
        scale: "score_1_10",
        examples: {
          excellent: [
            "The mistake that cost me $100K in my first startup",
            "I was 2 weeks away from bankruptcy when this happened",
            "My boss said I'd never succeed. I just bought his company.",
            "I was wrong: AI builds trust, not noise, in 2025.",
            "Most profiles sell. In 2025, leaders teach with AI.",
            "Last chance: Secure your AI-powered brand advantage before Q4.",
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
          "Does it leverage Cialdini's Authority Principle with credibility markers? Look for specific numbers, expert credentials, institutional references, or proven track records that establish immediate trust.",
        weight: isFocusSkill("social_proof")
          ? focusSkillWeight
          : regularSkillWeight,
        scale: "score_1_10",
        examples: {
          excellent: [
            "After 10 years as a Google PM, here's what I learned about product launches",
            "Used by 500+ Fortune 500 companies, this framework changed everything",
            "The strategy that helped me scale 3 startups to 8-figure exits",
            "After 150 B2B audits, this AI branding playbook converts.",
            "3 data-backed AI tweaks to double B2B profile inquiries.",
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
          "Does it apply Cognitive Load Theory for instant comprehension? Look for simple language, clear structure, and minimal mental processing required. Avoid jargon and complexity.",
        weight: isFocusSkill("clarity_and_brevity")
          ? focusSkillWeight
          : regularSkillWeight,
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
          "Does it leverage the Self-Reference Effect for personal relevance? Look for specific audience callouts, role-specific pain points, or industry-relevant challenges that make the reader think 'this is about me'.",
        weight: isFocusSkill("relevance_to_audience")
          ? focusSkillWeight
          : regularSkillWeight,
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
          "Does it apply Goal Gradient Hypothesis with specific, achievable outcomes? Look for concrete promises, clear timelines, measurable results, or step-by-step processes that signal clear value.",
        weight: isFocusSkill("actionability_promise")
          ? focusSkillWeight
          : regularSkillWeight,
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

ADVANCED SCORING INSTRUCTIONS FOR HIGH-QUALITY MODELS:
1. Evaluate each criterion independently with specific reasoning
2. Use the FULL scoring range (1-10) - don't cluster around 5-7
3. REWARD sophisticated techniques: Score 8-10 for advanced copywriting (vulnerability, contrarian takes, teaching approach)
4. RECOGNIZE subtle authority: "150 B2B audits" = credibility, "data-backed" = expertise
5. VALUE emotional sophistication: "I was wrong" = vulnerability, "Leaders teach" = positioning
6. PENALIZE only true mediocrity: Score 3-5 for generic or templated content
7. Give your confidence level (1-10) for each evaluation
8. Identify specific strengths and weaknesses with concrete examples
9. Provide actionable recommendations for improvement, don't be too generic

CRITICAL SCORING CONSTRAINTS:
- All individual criterion scores MUST be between 1-10 (no exceptions)
- Overall score MUST be between 1-10 (calculate weighted average, then cap at 10)
- Excellence indicators should influence the score within the 1-10 range, not exceed it
- Red flags should lower scores within the 1-10 range, not go below 1

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
      });

      // Ensure scores are within valid ranges (1-10)
      const sanitizedResult = {
        ...result.object,
        overallScore: Math.max(1, Math.min(10, result.object.overallScore)),
        criteriaResults: result.object.criteriaResults.map((cr) => ({
          ...cr,
          score: Math.max(1, Math.min(10, cr.score)),
          confidence: Math.max(1, Math.min(10, cr.confidence)),
        })),
        validationFlags: {
          coherentReasoning: true,
          appropriateScoring: true,
          consistentWithCriteria: true,
        },
      };

      return sanitizedResult;
    } catch (error) {
      console.error(`Error with judge model ${modelId}:`, error);
      // Fallback to text generation if structured output fails
      console.log("Falling back to text generation...");
      throw error;
    }
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
    const criteriaNames = criteria.map((c) => c.criterion).join(", ");
    const criteriaResults = result.criteriaResults
      .map((cr) => `${cr.criterion}: ${cr.score}/10`)
      .join(", ");

    const validationPrompt = `As a quality assurance evaluator, validate this LinkedIn hook evaluation:

CONTENT: "${content}"
OVERALL SCORE: ${result.overallScore}/10
CRITERIA SCORES: ${criteriaResults}
STRENGTHS: ${result.metaAnalysis.strengths.join(", ")}
WEAKNESSES: ${result.metaAnalysis.weaknesses.join(", ")}

EXPECTED CRITERIA: ${criteriaNames}
CRITERIA DESCRIPTIONS: ${criteria
      .map((c) => `${c.criterion}: ${c.description}`)
      .join("; ")}

VALIDATION CHECKS:
1. appropriateScoring: Is the overall score (${
      result.overallScore
    }/10) reasonable for this content quality?
2. consistentWithCriteria: Are all required criteria (${criteriaNames}) properly evaluated and do the scores align with their descriptions?
3. coherentReasoning: Do the identified strengths match the content and is the reasoning well-justified?

Respond ONLY with a JSON object containing these exact field names:
{
  "appropriateScoring": boolean,
  "consistentWithCriteria": boolean, 
  "coherentReasoning": boolean,
  "explanation": "optional brief explanation"
}`;

    try {
      const modelConfig = validateModelConfig(this.backupModelId);
      const model = getModelProvider(modelConfig);

      const validationResult = await generateObject({
        model,
        messages: [{ role: "user", content: validationPrompt }],
        schema: validationResultSchema,
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
    // Simple fallback evaluation using backup model with actual criteria
    try {
      const criteriaList = criteria
        .map((c) => `${c.criterion}: ${c.description}`)
        .join("; ");
      const simplePrompt = `Rate this ${
        context.contentType || "content"
      }: "${content}"

CRITERIA TO EVALUATE:
${criteriaList}

For each criterion, give a score 1-10. Then provide an overall score.
Format: CRITERION_NAME: [score] | OVERALL: [score] | REASON: [brief reason]`;

      const modelConfig = validateModelConfig(this.backupModelId);
      const model = getModelProvider(modelConfig);

      const response = await generateText({
        model,
        messages: [{ role: "user", content: simplePrompt }],
        temperature: 0.3,
      });

      const result = response.text;
      const overallMatch = result.match(/OVERALL:\s*(\d+)/);
      const reasonMatch = result.match(/REASON:\s*(.*)/);

      // Try to extract individual criterion scores
      const criteriaResults: JudgeResult[] = criteria.map((criterion) => {
        const scoreMatch = result.match(
          new RegExp(`${criterion.criterion}:\\s*(\\d+)`, "i")
        );
        return {
          criterion: criterion.criterion,
          score: scoreMatch ? parseInt(scoreMatch[1]) : 5,
          reasoning: reasonMatch ? reasonMatch[1] : "Fallback evaluation",
          confidence: 5,
        };
      });

      return {
        overallScore: Math.max(
          1,
          Math.min(10, overallMatch ? parseInt(overallMatch[1]) : 5)
        ),
        criteriaResults: criteriaResults.map((cr) => ({
          ...cr,
          score: Math.max(1, Math.min(10, cr.score)),
          confidence: Math.max(1, Math.min(10, cr.confidence)),
        })),
        metaAnalysis: {
          strengths: [reasonMatch ? reasonMatch[1] : "Basic evaluation"],
          weaknesses: ["Fallback evaluation used - limited analysis"],
          recommendations: [
            "Retry with main judge model for detailed evaluation",
          ],
        },
        judgeConfidence: 4,
        validationFlags: {
          coherentReasoning: false,
          appropriateScoring: false,
          consistentWithCriteria: false,
        },
      };
    } catch (error) {
      console.error("Fallback evaluation failed:", error);

      // Ultimate fallback with basic criteria scoring
      const criteriaResults: JudgeResult[] = criteria.map((criterion) => ({
        criterion: criterion.criterion,
        score: 5,
        reasoning: "Error in fallback evaluation",
        confidence: 1,
      }));

      return {
        overallScore: 5,
        criteriaResults,
        metaAnalysis: {
          strengths: ["Content evaluated"],
          weaknesses: ["Evaluation system error"],
          recommendations: ["Check evaluation system configuration"],
        },
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
