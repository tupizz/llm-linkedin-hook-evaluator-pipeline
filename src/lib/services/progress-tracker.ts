import { StreamingService } from "./streaming-service";

/**
 * Progress tracking service
 * Manages pipeline progress with accurate, monotonic progress updates
 */

interface ProgressPhase {
  name: string;
  weight: number; // Percentage of total progress (0-100)
  steps: ProgressStep[];
}

interface ProgressStep {
  name: string;
  weight: number; // Percentage within the phase (0-100)
  completed: boolean;
}

interface ModelProgress {
  modelId: string;
  hooksGenerated: boolean;
  hooksEvaluated: boolean;
  completed: boolean;
}

export class ProgressTracker {
  private phases: ProgressPhase[] = [];
  private currentPhase: number = 0;
  private modelProgress: Map<string, ModelProgress> = new Map();
  private lastReportedProgress: number = 0;

  constructor(selectedModels: string[], analysisOptions: string[]) {
    this.initializePhases(selectedModels, analysisOptions);
    this.initializeModelProgress(selectedModels);
  }

  private initializePhases(selectedModels: string[], analysisOptions: string[]) {
    this.phases = [
      {
        name: "Initialization",
        weight: 5,
        steps: [
          { name: "Pipeline setup", weight: 100, completed: false }
        ]
      },
      {
        name: "Model Processing",
        weight: 70,
        steps: [
          { name: "Hook generation", weight: 40, completed: false },
          { name: "Hook evaluation", weight: 60, completed: false }
        ]
      },
      {
        name: "Analysis",
        weight: 20,
        steps: analysisOptions.map(option => ({
          name: `${option} analysis`,
          weight: 100 / (analysisOptions.length + 1), // +1 for comparative
          completed: false
        })).concat([
          { name: "Comparative analysis", weight: 100 / (analysisOptions.length + 1), completed: false }
        ])
      },
      {
        name: "Finalization",
        weight: 5,
        steps: [
          { name: "Results compilation", weight: 100, completed: false }
        ]
      }
    ];
  }

  private initializeModelProgress(selectedModels: string[]) {
    selectedModels.forEach(modelId => {
      this.modelProgress.set(modelId, {
        modelId,
        hooksGenerated: false,
        hooksEvaluated: false,
        completed: false
      });
    });
  }

  /**
   * Calculate overall progress percentage
   */
  private calculateProgress(): number {
    let totalProgress = 0;

    for (let i = 0; i < this.phases.length; i++) {
      const phase = this.phases[i];
      
      if (i < this.currentPhase) {
        // Completed phases contribute full weight
        totalProgress += phase.weight;
      } else if (i === this.currentPhase) {
        // Current phase contributes partial weight based on steps
        const phaseProgress = this.calculatePhaseProgress(phase);
        totalProgress += (phase.weight * phaseProgress) / 100;
      }
      // Future phases contribute nothing
    }

    return Math.min(100, Math.max(this.lastReportedProgress, Math.round(totalProgress)));
  }

  private calculatePhaseProgress(phase: ProgressPhase): number {
    if (phase.name === "Model Processing") {
      return this.calculateModelProcessingProgress();
    }

    const completedSteps = phase.steps.filter(step => step.completed);
    const totalWeight = phase.steps.reduce((sum, step) => sum + step.weight, 0);
    const completedWeight = completedSteps.reduce((sum, step) => sum + step.weight, 0);
    
    return totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  }

  private calculateModelProcessingProgress(): number {
    const models = Array.from(this.modelProgress.values());
    if (models.length === 0) return 0;

    let totalProgress = 0;
    models.forEach(model => {
      if (model.completed) {
        totalProgress += 100;
      } else if (model.hooksEvaluated) {
        totalProgress += 90;
      } else if (model.hooksGenerated) {
        totalProgress += 40;
      }
    });

    return totalProgress / models.length;
  }

  /**
   * Send progress update if it has increased
   */
  private sendProgressIfIncreased(
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>,
    message: string,
    modelId?: string
  ) {
    const currentProgress = this.calculateProgress();
    
    // Only send if progress has increased or it's a significant update
    if (currentProgress > this.lastReportedProgress || 
        currentProgress === 100 || 
        currentProgress === 0) {
      streamingService.sendProgress(controller, message, currentProgress, modelId);
      this.lastReportedProgress = currentProgress;
    }
  }

  /**
   * Mark initialization as complete
   */
  initComplete(
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    this.phases[0].steps[0].completed = true;
    this.currentPhase = 1;
    this.sendProgressIfIncreased(
      streamingService,
      controller,
      "Pipeline initialized, starting model processing..."
    );
  }

  /**
   * Mark hook generation complete for a model
   */
  modelHooksGenerated(
    modelId: string,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    const progress = this.modelProgress.get(modelId);
    if (progress) {
      progress.hooksGenerated = true;
      this.sendProgressIfIncreased(
        streamingService,
        controller,
        `Generated hooks for ${modelId}`,
        modelId
      );
    }
  }

  /**
   * Mark hook evaluation complete for a model
   */
  modelHooksEvaluated(
    modelId: string,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    const progress = this.modelProgress.get(modelId);
    if (progress) {
      progress.hooksEvaluated = true;
      this.sendProgressIfIncreased(
        streamingService,
        controller,
        `Evaluated hooks for ${modelId}`,
        modelId
      );
    }
  }

  /**
   * Mark model processing complete
   */
  modelComplete(
    modelId: string,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    const progress = this.modelProgress.get(modelId);
    if (progress) {
      progress.completed = true;
      this.sendProgressIfIncreased(
        streamingService,
        controller,
        `Completed processing ${modelId}`,
        modelId
      );
    }
  }

  /**
   * Mark all models processing complete
   */
  allModelsComplete(
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    this.phases[1].steps.forEach(step => step.completed = true);
    this.currentPhase = 2;
    
    const completed = Array.from(this.modelProgress.values()).filter(m => m.completed).length;
    const total = this.modelProgress.size;
    
    this.sendProgressIfIncreased(
      streamingService,
      controller,
      `Model processing complete (${completed}/${total}), starting analysis...`
    );
  }

  /**
   * Mark analysis step complete
   */
  analysisStepComplete(
    stepName: string,
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    const analysisPhase = this.phases[2];
    const step = analysisPhase.steps.find(s => s.name.includes(stepName));
    if (step) {
      step.completed = true;
      this.sendProgressIfIncreased(
        streamingService,
        controller,
        `Completed ${stepName}`
      );
    }
  }

  /**
   * Mark analysis phase complete
   */
  analysisComplete(
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    this.phases[2].steps.forEach(step => step.completed = true);
    this.currentPhase = 3;
    this.sendProgressIfIncreased(
      streamingService,
      controller,
      "Analysis complete, finalizing results..."
    );
  }

  /**
   * Mark entire pipeline complete
   */
  pipelineComplete(
    streamingService: StreamingService,
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    this.phases[3].steps[0].completed = true;
    this.currentPhase = 4;
    // Force progress to 100%
    this.lastReportedProgress = 99; // Allow 100% to be sent
    streamingService.sendProgress(controller, "Pipeline complete!", 100);
  }

  /**
   * Get current progress for debugging
   */
  getProgressSummary() {
    return {
      currentPhase: this.phases[this.currentPhase]?.name || "Complete",
      overallProgress: this.calculateProgress(),
      modelProgress: Array.from(this.modelProgress.entries()).map(([id, progress]) => ({
        modelId: id,
        status: progress.completed ? "Complete" : 
                progress.hooksEvaluated ? "Evaluated" :
                progress.hooksGenerated ? "Generated" : "Starting"
      }))
    };
  }
}