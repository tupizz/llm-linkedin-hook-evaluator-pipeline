import { ValidationError } from "./validation-service";

/**
 * Error handling service
 * Centralized error management and response formatting
 */

export class ErrorService {
  /**
   * Creates a validation error response
   */
  static createValidationErrorResponse(error: ValidationError, status: number): Response {
    return new Response(JSON.stringify(error), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  /**
   * Creates an internal server error response
   */
  static createInternalErrorResponse(error: unknown): Response {
    console.error("Internal server error:", error);
    
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: "An unexpected error occurred while processing the request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  /**
   * Logs and formats error for development
   */
  static logError(context: string, error: unknown): void {
    console.error(`[${context}]`, error);
  }
}