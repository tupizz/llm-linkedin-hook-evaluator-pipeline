import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { generateObject, streamText } from "ai";
import { z } from "zod";

// Schema for hook generation
const hooksSchema = z.object({
  hooks: z.array(z.string()).length(5),
});

export interface ModelConfig {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
  model: string;
  supported: boolean;
  maxTokens?: number;
  new?: boolean;
}

// Unified model configurations with both OpenAI and Anthropic
export const UNIFIED_MODEL_CONFIGS: ModelConfig[] = [
  // OpenAI Models - Only newer models support structured outputs
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai",
    model: "gpt-5",
    supported: true,
    new: true,
    maxTokens: 400000,
  },
  {
    id: "gpt4o",
    name: "GPT-4o",
    provider: "openai",
    model: "gpt-4o",
    supported: true,
    maxTokens: 4096,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "openai",
    model: "gpt-4.1",
    supported: true,
    maxTokens: 4096,
  },
  {
    id: "gpt4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    model: "gpt-4o-mini",
    supported: true,
    maxTokens: 4096,
  },
  {
    id: "o4-mini",
    name: "O4 Mini",
    provider: "openai",
    model: "o4-mini",
    supported: true,
    maxTokens: 4096,
  },
  // Anthropic Models
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    model: "claude-3-5-haiku-latest",
    supported: true,
    maxTokens: 4096,
  },
  {
    id: "claude-opus-4-1",
    name: "Claude Opus 4.1",
    provider: "anthropic",
    model: "claude-opus-4-1",
    supported: true,
    maxTokens: 4096,
  },
];

export function getModelProvider(modelConfig: ModelConfig) {
  switch (modelConfig.provider) {
    case "openai":
      return openai(modelConfig.model);
    case "anthropic":
      return anthropic(modelConfig.model);
    default:
      throw new Error(`Unsupported provider: ${modelConfig.provider}`);
  }
}

export function getContextualPrompt(
  postIdea: string,
  contentType: string,
  evaluationContext: string,
  industry?: string,
  focusSkills?: string[],
  targetAudience?: string
) {
  const contextualModifiers = {
    professional: "professional LinkedIn network",
    thought_leadership: "industry thought leaders and executives",
    brand_building: "brand awareness and company positioning",
    lead_generation: "potential clients and business opportunities",
    community_building: "engaged professional communities",
  };

  const contentTypeModifiers = {
    tip: "actionable professional advice",
    story: "compelling personal narrative",
    announcement: "important news or updates",
    question: "engaging thought-provoking question",
  };

  const industryContext = industry
    ? `\nIndustry context: ${industry} sector`
    : "";

  // Science-backed skill descriptions with psychological principles
  const skillDescriptions: Record<string, string> = {
    attention_grabbing: "curiosity-triggering (Information Gap Theory - Loewenstein)",
    emotional_impact: "emotionally contagious (Mirror Neurons & Emotional Contagion)",
    social_proof: "authority-driven with credibility markers (Cialdini's Authority Principle)",
    clarity_and_brevity: "cognitively simple and instantly processable (Cognitive Load Theory)",
    relevance_to_audience: "personally relevant and self-referential (Self-Reference Effect)",
    actionability_promise: "outcome-specific with clear achievability (Goal Gradient Hypothesis)",
  };

  // Detailed science-backed templates for each skill
  const skillTemplates: Record<string, string[]> = {
    attention_grabbing: [
      "Most people do [X]. Here's what they should do instead.",
      "You won't believe how [X] affects [Y].",
      "What you don't know about [topic] could [consequence]."
    ],
    emotional_impact: [
      "I [emotional experience] when [situation]—then [transformation].",
      "Imagine being [emotion] because [context].",
      "[Name] never thought [thing] would happen. Then it did."
    ],
    social_proof: [
      "Why [credible person/org] does [thing] differently.",
      "Used by [X]% of [target group]—are you missing out?",
      "Based on [institution] study, here's what we learned."
    ],
    clarity_and_brevity: [
      "How to [achieve X] in [timeframe].",
      "The fastest way to [result] without [pain point].",
      "[Specific number] steps to [clear outcome]."
    ],
    relevance_to_audience: [
      "[Target audience]: Here's what you're getting wrong about [topic].",
      "If you're a [role], read this before [action].",
      "This mistake costs [audience] [specific consequence] every [timeframe]."
    ],
    actionability_promise: [
      "Double your [metric] in [X time] using [method].",
      "Get [specific result] with these [X] steps—starting today.",
      "A simple checklist to [solve problem] in under [time]."
    ]
  };

  // Generate detailed focus skills context with templates
  const focusSkillsContext =
    focusSkills && focusSkills.length > 0
      ? `\nPRIORITY FOCUS: Generate hooks that are especially ${focusSkills
          .map((skill) => skillDescriptions[skill] || skill)
          .join(", ")}. These aspects should be the strongest features of your hooks.

SCIENTIFIC FRAMEWORKS TO APPLY:
${focusSkills
  .map((skill) => {
    const templates = skillTemplates[skill] || [];
    return `• ${skill.toUpperCase()}: ${skillDescriptions[skill]}
  Templates: ${templates.join(" | ")}`;
  })
  .join("\n")}`
      : `\nAPPLY THESE SCIENTIFIC FRAMEWORKS:
• INFORMATION GAP THEORY: Create curiosity gaps that make people want to know more
• EMOTIONAL CONTAGION: Use emotional language that triggers mirror neuron responses  
• AUTHORITY PRINCIPLE: Include credibility markers, data, or expert positioning
• COGNITIVE LOAD THEORY: Keep language simple and instantly understandable
• SELF-REFERENCE EFFECT: Make it personally relevant to the target audience
• GOAL GRADIENT HYPOTHESIS: Promise specific, achievable outcomes`;

  return `You are an expert LinkedIn content strategist specializing in ${
    contextualModifiers[
      evaluationContext as keyof typeof contextualModifiers
    ] || "professional content"
  }.

Generate 5 compelling LinkedIn post hooks optimized for ${
    contentTypeModifiers[contentType as keyof typeof contentTypeModifiers] ||
    "professional content"
  }.${industryContext}${focusSkillsContext} and we should focus on ${targetAudience} audience.

REQUIREMENTS:
- Each hook should be 6-12 words long
- Must evoke strong emotions like (${
    focusSkills && focusSkills.length > 0
      ? focusSkills
          .map(
            (skill) =>
              skillDescriptions[skill as keyof typeof skillDescriptions] ||
              skill
          )
          .join(", ")
      : "curiosity, surprise, urgency, excitement, empathy"
  })
- Should be highly relevant for B2B/professional LinkedIn audience
- Use clear, accessible English (non-native speaker friendly)
- Create "scroll-stopper" impact
- Avoid jargon and overly complex terms
- Match the ${contentType} content type requirements

BONUS POINTS for hooks that include:
- Numbers/statistics for credibility
- Contrarian or surprising insights
- Personal vulnerability or authenticity
- Clear value propositions
- Time-sensitive elements

POST IDEA: ${postIdea}

Generate exactly 5 compelling hooks. Your response will be automatically structured as JSON.`;
}

export async function generateHooksWithModel(
  modelConfig: ModelConfig,
  prompt: string
): Promise<{ hooks: string[]; executionTime: number; tokenUsage?: number }> {
  const startTime = performance.now();

  try {
    const model = getModelProvider(modelConfig);

    // Check if model supports structured outputs
    const supportsStructuredOutput = true;
    let hooks: string[] = [];
    let tokenUsage: number | undefined;

    if (supportsStructuredOutput) {
      const result = await generateObject({
        model,
        messages: [{ role: "user", content: prompt }],
        schema: hooksSchema,
      });

      hooks = result.object.hooks;
      tokenUsage = result.usage?.totalTokens;
    } else {
      // Fallback for models that don't support structured outputs
      const { generateText } = await import("ai");

      const enhancedPrompt = `${prompt}

IMPORTANT: Respond with ONLY a valid JSON object in this exact format:
{"hooks": ["hook1", "hook2", "hook3", "hook4", "hook5"]}

No additional text, explanations, or formatting. Just the JSON object with exactly 5 hooks.`;

      const result = await generateText({
        model,
        messages: [{ role: "user", content: enhancedPrompt }],
      });

      tokenUsage = result.usage?.totalTokens;

      // Parse the JSON response
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.hooks || !Array.isArray(parsed.hooks)) {
          throw new Error("Invalid hooks format");
        }

        hooks = parsed.hooks.slice(0, 5); // Ensure exactly 5 hooks
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        // Emergency fallback - split by lines and clean up
        const lines = result.text
          .split("\n")
          .filter(
            (line) =>
              line.trim() &&
              !line.includes("{") &&
              !line.includes("}") &&
              !line.includes('"hooks"')
          );
        const fallbackHooks = lines
          .slice(0, 5)
          .map((line) =>
            line
              .replace(/^["'\-\d\.\s]*/, "")
              .replace(/["']*$/, "")
              .trim()
          )
          .filter(Boolean);

        hooks =
          fallbackHooks.length >= 3
            ? fallbackHooks
            : [
                "AI-powered development tools boost productivity",
                "Machine learning transforms software engineering",
                "Automated testing saves engineering hours",
                "AI code review catches bugs faster",
                "Smart debugging reduces development time",
              ];
      }
    }

    // Calculate execution time at the very end
    const executionTime = Math.round(performance.now() - startTime);

    return {
      hooks,
      executionTime,
      tokenUsage,
    };
  } catch (error) {
    console.log("error => ", error);
    const executionTime = Math.round(performance.now() - startTime);
    console.error(`Error with ${modelConfig.name}:`, error);
    throw new Error(
      `Failed to generate hooks with ${modelConfig.name}: ${error} (took ${executionTime}ms)`
    );
  }
}

export async function streamHooksGeneration(
  modelConfig: ModelConfig,
  prompt: string,
  onProgress?: (text: string) => void
) {
  try {
    const model = getModelProvider(modelConfig);

    const result = await streamText({
      model,
      messages: [{ role: "user", content: prompt }],
    });

    let fullText = "";

    for await (const delta of result.textStream) {
      fullText += delta;
      if (onProgress) {
        onProgress(fullText);
      }
    }

    return {
      text: fullText,
      usage: await result.usage,
    };
  } catch (error) {
    console.error(`Error streaming with ${modelConfig.name}:`, error);
    throw new Error(`Failed to stream with ${modelConfig.name}: ${error}`);
  }
}

export function validateModelConfig(modelId: string): ModelConfig {
  const config = UNIFIED_MODEL_CONFIGS.find((m) => m.id === modelId);
  if (!config) {
    throw new Error(`Model configuration not found for: ${modelId}`);
  }
  if (!config.supported) {
    throw new Error(`Model not supported: ${config.name}`);
  }
  return config;
}

export function getAvailableModels(): ModelConfig[] {
  return UNIFIED_MODEL_CONFIGS.filter((model) => model.supported);
}

export function getModelsByProvider(
  provider: "openai" | "anthropic"
): ModelConfig[] {
  return UNIFIED_MODEL_CONFIGS.filter(
    (model) => model.provider === provider && model.supported
  );
}
