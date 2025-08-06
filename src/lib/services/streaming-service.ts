/**
 * Streaming service for Server-Sent Events
 * Handles progress updates and result streaming
 */

export interface StreamEvent {
  type: "progress" | "error" | "complete";
  step: string;
  modelId?: string;
  progress?: number;
  data?: Record<string, unknown>;
  error?: string;
}

export class StreamingService {
  private encoder = new TextEncoder();

  /**
   * Creates a formatted SSE event string
   */
  private createStreamEvent(event: StreamEvent): string {
    return `data: ${JSON.stringify(event)}\n\n`;
  }

  /**
   * Sends a progress update
   */
  sendProgress(
    controller: ReadableStreamDefaultController<Uint8Array>,
    step: string,
    progress: number,
    modelId?: string
  ): void {
    controller.enqueue(
      this.encoder.encode(
        this.createStreamEvent({
          type: "progress",
          step,
          progress,
          modelId,
        })
      )
    );
  }

  /**
   * Sends an error event
   */
  sendError(
    controller: ReadableStreamDefaultController<Uint8Array>,
    step: string,
    error: string,
    modelId?: string
  ): void {
    controller.enqueue(
      this.encoder.encode(
        this.createStreamEvent({
          type: "error",
          step,
          error,
          modelId,
        })
      )
    );
  }

  /**
   * Sends completion event with results
   */
  sendComplete(
    controller: ReadableStreamDefaultController<Uint8Array>,
    data: any
  ): void {
    controller.enqueue(
      this.encoder.encode(
        this.createStreamEvent({
          type: "complete",
          step: "Analysis complete! Results ready.",
          progress: 100,
          data,
        })
      )
    );
  }

  /**
   * Creates the main readable stream for SSE
   */
  createStream(
    processor: (streamingService: StreamingService, controller: ReadableStreamDefaultController<Uint8Array>) => Promise<void>
  ): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start: (controller) => {
        processor(this, controller)
          .catch((error) => {
            this.sendError(
              controller,
              "Pipeline failed",
              error instanceof Error ? error.message : "Unknown error"
            );
          })
          .finally(() => {
            controller.close();
          });
      },
    });
  }

  /**
   * Creates SSE response headers
   */
  getSSEHeaders(): HeadersInit {
    return {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
  }
}