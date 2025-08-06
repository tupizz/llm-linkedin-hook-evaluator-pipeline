/**
 * LinkedIn Hook Generation and Evaluation API
 *
 * This endpoint processes LinkedIn post ideas through a comprehensive pipeline:
 * 1. Request validation using Zod schema
 * 2. Multi-model hook generation (GPT-4o, Claude, etc.)
 * 3. LLM-as-a-Judge evaluation with detailed criteria
 * 4. Comparative analysis between models
 * 5. Real-time progress streaming via Server-Sent Events
 *
 * Features:
 * - Supports 6+ AI models from OpenAI and Anthropic
 * - Focus skills system for targeted hook characteristics
 * - Advanced evaluation with confidence scoring
 * - Comprehensive error handling and fallbacks
 * - Detailed analytics and insights generation
 *
 * @see README.md for detailed documentation
 */

import {
  ErrorService,
  PipelineService,
  StreamingService,
  validateRequest,
} from "@/lib/services";
import { NextRequest } from "next/server";
import {
  GenerateHooksStreamValidatedRequestBody,
  generateHookStreamRequestBodySchema,
} from "./schema";

/**
 * Main API endpoint handler
 * Clean, service-based architecture following single responsibility principles
 */
export async function POST(request: NextRequest): Promise<Response> {
  console.log("API Route hit - debugging enabled"); // Remove after testing
  debugger; // This will force a breakpoint
  try {
    // Step 1: Validate request
    const validation = await validateRequest(
      request,
      generateHookStreamRequestBodySchema
    );

    if (!validation.success) {
      return ErrorService.createValidationErrorResponse(
        validation.error,
        validation.status
      );
    }

    // Step 2: Initialize services
    const streamingService = new StreamingService();
    const pipelineService = new PipelineService();

    // Step 3: Create and return streaming response
    const stream = streamingService.createStream(
      async (streaming, controller) => {
        await pipelineService.execute(
          validation.data as GenerateHooksStreamValidatedRequestBody,
          streaming,
          controller
        );
      }
    );

    return new Response(stream, {
      headers: streamingService.getSSEHeaders(),
    });
  } catch (error) {
    ErrorService.logError("POST handler", error);
    return ErrorService.createInternalErrorResponse(error);
  }
}
