import { UNIFIED_MODEL_CONFIGS } from "@/lib/unified-llm-service";
import { z } from "zod";

// Zod validation schema for request body
export const generateHookStreamRequestBodySchema = z.object({
  postIdea: z
    .string()
    .min(10, "Post idea must be at least 10 characters long")
    .max(1000, "Post idea must be less than 1000 characters")
    .refine(
      (val) => val.trim().length > 0,
      "Post idea cannot be empty or only whitespace"
    ),

  industry: z
    .string()
    .max(100, "Industry must be less than 100 characters")
    .optional()
    .or(z.literal("")),

  targetAudience: z
    .enum(["beginner", "intermediate", "expert"], {
      errorMap: () => ({
        message: "Target audience must be beginner, intermediate, or expert",
      }),
    })
    .default("intermediate"),

  contentType: z
    .enum(["tip", "story", "announcement", "question"], {
      errorMap: () => ({
        message: "Content type must be tip, story, announcement, or question",
      }),
    })
    .default("tip"),

  selectedModels: z
    .array(z.string())
    .min(1, "At least one AI model must be selected")
    .max(6, "Cannot select more than 6 AI models")
    .refine(
      (models) =>
        models.every((modelId) =>
          UNIFIED_MODEL_CONFIGS.some(
            (config) => config.id === modelId && config.supported
          )
        ),
      "All selected models must be valid and supported"
    ),

  focusSkills: z
    .array(
      z.enum([
        "attention_grabbing",
        "emotional_impact",
        "social_proof",
        "clarity_and_brevity",
        "relevance_to_audience",
        "actionability_promise",
      ])
    )
    .max(3, "Cannot select more than 3 focus skills")
    .default([]),

  analysisOptions: z
    .array(z.enum(["semantic", "psychological", "engagement"]))
    .default(["semantic", "psychological", "engagement"]),
});

export type GenerateHooksStreamValidatedRequestBody = z.infer<
  typeof generateHookStreamRequestBodySchema
>;
