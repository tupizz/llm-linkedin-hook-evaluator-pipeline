"use client";

import { LoadingIndicator } from "@/components/molecules";
import {
  AnalysisSummary,
  BackToNavigation,
  ConfigurationPanel,
  Header,
  ModelResults,
  PerformanceCharts,
  RightSidebarNavigation,
} from "@/components/organisms";
import { useHookGeneration } from "@/hooks/useHookGeneration";
import { useScrollUtils } from "@/hooks/useScrollUtils";
import { useUIState } from "@/hooks/useUIState";
import { ModelConfig, UNIFIED_MODEL_CONFIGS } from "@/lib/unified-llm-service";

// Enhanced model descriptions
function getModelDescription(model: ModelConfig): string {
  const descriptions: Record<string, string> = {
    gpt4o: "Most advanced OpenAI model with superior creativity",
    "gpt4o-mini": "Fast and efficient OpenAI model",
    "gpt-4.1":
      "GPT-4.1 is our flagship model for complex tasks. It is well suited for problem solving across domains.",
    "claude-opus-4-1":
      "Claude Opus 4.1 is our flagship model for complex tasks. It is well suited for problem solving across domains.",
    "claude-3-5-haiku":
      "Claude 3.5 Haiku is our flagship model for complex tasks. It is well suited for problem solving across domains.",
  };
  return descriptions[model.id] || `${model.name} - ${model.provider} model`;
}

const AVAILABLE_MODELS: ModelConfig[] = UNIFIED_MODEL_CONFIGS.map((model) => ({
  ...model,
  description: getModelDescription(model),
  apiModel: model.model,
}));

export default function Home() {
  const hookGeneration = useHookGeneration();
  const uiState = useUIState();
  const scrollUtils = useScrollUtils();

  const hasResults = !!hookGeneration.results && !hookGeneration.isLoading;
  const shouldShowSidebar = hookGeneration.isLoading || hasResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header
        hasResults={hasResults}
        isLoading={hookGeneration.isLoading}
        onSaveAnalysis={hookGeneration.saveAnalysis}
        onShowJudgeAnalysis={() => uiState.setShowJudgeAnalysis(true)}
        onTogglePerformanceCharts={uiState.togglePerformanceCharts}
      />

      <main className="max-w-[1500px] mx-auto px-6 py-8">
        <div
          className={`transition-all duration-700 ease-in-out ${
            shouldShowSidebar
              ? "grid grid-cols-1 lg:grid-cols-12 gap-6"
              : "flex justify-center items-start min-h-[70vh]"
          }`}
        >
          {/* Results Area - Main content area */}
          {shouldShowSidebar && (
            <div className="lg:col-span-7 transition-all duration-700 ease-in-out">
              {hookGeneration.isLoading && (
                <LoadingIndicator
                  currentStep={hookGeneration.currentStep}
                  progress={hookGeneration.progress}
                />
              )}

              {hasResults && (
                <div className="space-y-6">
                  <AnalysisSummary
                    comparison={hookGeneration.results.comparison}
                    metadata={hookGeneration.results.metadata}
                    results={hookGeneration.results.results}
                    availableModels={AVAILABLE_MODELS}
                  />

                  {/* Performance Charts */}
                  {uiState.showPerformanceCharts && (
                    <PerformanceCharts
                      results={hookGeneration.results.results}
                      availableModels={AVAILABLE_MODELS}
                      onClose={() => uiState.setShowPerformanceCharts(false)}
                    />
                  )}

                  {/* Model Results */}
                  <ModelResults
                    results={hookGeneration.results.results}
                    comparison={hookGeneration.results.comparison}
                    availableModels={AVAILABLE_MODELS}
                  />

                  {/* Back to Navigation */}
                  <BackToNavigation scrollUtils={scrollUtils} />
                </div>
              )}
            </div>
          )}

          {/* Right Sidebar - Navigation and Configuration */}
          <div
            className={`transition-all duration-700 ease-in-out space-y-6 ${
              shouldShowSidebar
                ? "lg:col-span-5 order-last sticky top-24 self-start max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar"
                : "w-full"
            }`}
          >
            {/* Right Sidebar Navigation - Only shows when we have results */}
            {hasResults && (
              <RightSidebarNavigation
                results={hookGeneration.results}
                availableModels={AVAILABLE_MODELS}
                scrollUtils={scrollUtils}
                userConfiguration={{
                  postIdea: hookGeneration.postIdea,
                  selectedModels: hookGeneration.selectedModels,
                  focusSkills: hookGeneration.focusSkills,
                  contentType: hookGeneration.contentType,
                  industry: hookGeneration.industry,
                  targetAudience: hookGeneration.targetAudience,
                }}
                isLoading={hookGeneration.isLoading}
              />
            )}

            {/* Configuration Panel - Only show when no results */}
            {!hasResults && (
              <ConfigurationPanel
                postIdea={hookGeneration.postIdea}
                industry={hookGeneration.industry}
                targetAudience={hookGeneration.targetAudience}
                contentType={hookGeneration.contentType}
                selectedModels={hookGeneration.selectedModels}
                focusSkills={hookGeneration.focusSkills}
                availableModels={AVAILABLE_MODELS}
                isLoading={hookGeneration.isLoading}
                hasResults={hasResults}
                onPostIdeaChange={hookGeneration.setPostIdea}
                onIndustryChange={hookGeneration.setIndustry}
                onTargetAudienceChange={hookGeneration.setTargetAudience}
                onContentTypeChange={hookGeneration.setContentType}
                onSelectedModelsChange={hookGeneration.setSelectedModels}
                onFocusSkillsChange={hookGeneration.setFocusSkills}
                onGenerate={hookGeneration.handleGenerate}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
