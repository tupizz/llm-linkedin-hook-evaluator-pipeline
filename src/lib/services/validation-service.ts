import { z } from "zod";

/**
 * Request validation service
 * Handles all input validation and sanitization
 */

export interface ValidationError {
  error: string;
  details: string;
  issues: z.ZodIssue[];
}

/**
 * Validates and parses JSON request body
 */
export async function validateRequest<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ValidationError;
      status: number;
    }
> {
  try {
    // Parse JSON
    const rawBody = await request.json();

    // Validate with Zod
    const validationResult = schema.safeParse(rawBody);

    if (!validationResult.success) {
      const errorMessages = validationResult.error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");

      return {
        success: false,
        error: {
          error: "Validation failed",
          details: errorMessages,
          issues: validationResult.error.errors,
        },
        status: 400,
      };
    }

    return {
      success: true,
      data: validationResult.data,
    };
  } catch (jsonError: unknown) {
    if (jsonError instanceof Error) {
      return {
        success: false,
        error: {
          error: "Invalid JSON in request body",
          details: jsonError.message,
          issues: [],
        },
        status: 400,
      };
    }

    return {
      success: false,
      error: {
        error: "Invalid JSON in request body",
        details: "Request body must be valid JSON",
        issues: [],
      },
      status: 400,
    };
  }
}
