"use client";

import HookRadarChart from "@/components/HookRadarChart";
import { ModelConfig, UNIFIED_MODEL_CONFIGS } from "@/lib/unified-llm-service";
import { AnalysisOption } from "@/types";
import {
  ArrowUp,
  BarChart3,
  ChevronRight,
  Crown,
  List,
  Save,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";

// Enhanced model descriptions
function getModelDescription(model: ModelConfig): string {
  const descriptions: Record<string, string> = {
    gpt4o: "Most advanced OpenAI model with superior creativity",
    "gpt4o-mini": "Fast and efficient OpenAI model",
    "gpt-4.1":
      "GPT-4.1 is our flagship model for complex tasks. It is well suited for problem solving across domains.",
    "claude-3-5-sonnet": "Anthropic's flagship model with excellent reasoning",
    "claude-3-5-haiku": "Lightning-fast Anthropic model",
    "claude-3-opus": "Most capable Anthropic model for complex tasks",
  };
  return descriptions[model.id] || `${model.name} - ${model.provider} model`;
}

const AVAILABLE_MODELS: ModelConfig[] = UNIFIED_MODEL_CONFIGS.map((model) => ({
  ...model,
  description: getModelDescription(model),
  apiModel: model.model,
}));

const DEFAULT_ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: "semantic",
    name: "Emotional Impact",
    description: "Analyze curiosity, surprise, and emotional triggers",
    category: "psychology",
    enabled: true,
  },
  {
    id: "psychological",
    name: "Persuasion Triggers",
    description: "Detect authority, scarcity, social proof patterns",
    category: "psychology",
    enabled: true,
  },
  {
    id: "engagement",
    name: "Virality Prediction",
    description: "Predict likes, comments, shares potential",
    category: "engagement",
    enabled: true,
  },
];

// Smooth scroll utility with offset for sticky header
const scrollToSection = (elementId: string) => {
  const element = document.getElementById(elementId);
  if (element) {
    const offset = 100; // Account for sticky header + some padding
    const elementPosition =
      element.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({
      top: elementPosition,
      behavior: "smooth",
    });
  }
};

export default function Home() {
  const [postIdea, setPostIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("intermediate");
  const [contentType, setContentType] = useState("tip");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "gpt4o",
    "claude-3-5-sonnet",
  ]);
  const [analysisOptions] = useState<AnalysisOption[]>(
    DEFAULT_ANALYSIS_OPTIONS
  );
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);
  const [showJudgeAnalysis, setShowJudgeAnalysis] = useState(false);
  const [showPerformanceCharts, setShowPerformanceCharts] = useState(false);

  const getEnabledAnalysisTypes = () => {
    return analysisOptions
      .filter((option) => option.enabled)
      .map((option) => option.id);
  };

  const saveAnalysis = async () => {
    if (!results) return;

    try {
      const exportData = {
        postIdea,
        industry,
        targetAudience,
        contentType,
        selectedModels,
        analysisOptions: getEnabledAnalysisTypes(),
        results: results.results,
        comparison: results.comparison,
        analytics: results.analytics,
        insights: results.insights,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/save-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `Analysis saved successfully!\nFile: ${
            result.filename
          }\nSize: ${Math.round(result.size / 1024)}KB`
        );
      } else {
        alert(`Failed to save analysis: ${result.error}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save analysis. Please try again.");
    }
  };

  const handleGenerate = async () => {
    if (!postIdea.trim()) return;

    setIsLoading(true);
    setResults(null);
    setProgress(0);
    setCurrentStep("Initializing...");

    try {
      const response = await fetch("/api/generate-hooks-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIdea,
          industry,
          targetAudience,
          contentType,
          selectedModels,
          analysisOptions: getEnabledAnalysisTypes(),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "progress") {
                setCurrentStep(event.step);
                setProgress(event.progress || 0);
              } else if (event.type === "complete") {
                setResults(event.data);
                setIsLoading(false);
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE event:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setCurrentStep("Generation failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">LH</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  LinkedIn Hook Evaluator
                </h1>
                <p className="text-slate-400 text-sm">
                  AI-powered hook analysis with LLM-as-a-Judge
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Action Buttons */}
              {results && !isLoading && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => saveAnalysis()}
                    className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm rounded-lg border border-emerald-500/30 transition-colors flex items-center space-x-2"
                    title="Save analysis data to file"
                  >
                    <Save size={16} />
                    <span>Save</span>
                  </button>

                  <button
                    onClick={() => setShowJudgeAnalysis(true)}
                    className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg border border-blue-500/30 transition-colors flex items-center space-x-2"
                    title="Analyze LLM judge responses"
                  >
                    <Search size={16} />
                    <span>Judge</span>
                  </button>

                  <button
                    onClick={() =>
                      setShowPerformanceCharts(!showPerformanceCharts)
                    }
                    className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 text-sm rounded-lg border border-purple-500/30 transition-colors flex items-center space-x-2"
                    title="Show performance charts"
                  >
                    <BarChart3 size={16} />
                    <span>Charts</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 py-8">
        <div
          className={`transition-all duration-700 ease-in-out ${
            isLoading || results
              ? "grid grid-cols-1 lg:grid-cols-3 gap-8"
              : "flex justify-center items-start min-h-[70vh]"
          }`}
        >
          {/* Results Area - Shows on left with more space when active */}
          {(isLoading || results) && (
            <div className="lg:col-span-2 transition-all duration-700 ease-in-out">
              {isLoading && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    <h3 className="text-lg font-medium text-white">
                      Processing
                    </h3>
                  </div>
                  <p className="text-slate-400 mb-4">{currentStep}</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-slate-400 mt-2">
                    {progress}%
                  </div>
                </div>
              )}

              {/* Table of Contents */}
              <div
                id="table-of-contents"
                className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-600/30 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <List size={18} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      Quick Navigation
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      window.scrollTo({ top: 0, behavior: "smooth" })
                    }
                    className="flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-colors text-slate-300 hover:text-white"
                    title="Back to top"
                  >
                    <ArrowUp size={16} />
                    <span className="text-sm">Top</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Overview Section */}
                  <button
                    onClick={() => scrollToSection("analysis-summary")}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/30 transition-all text-left group"
                  >
                    <div className="flex items-center space-x-3">
                      <Crown size={16} className="text-emerald-400" />
                      <div>
                        <span className="text-white font-medium text-sm">
                          Analysis Summary
                        </span>
                        <p className="text-slate-400 text-xs">
                          Winner and key metrics
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-400 group-hover:text-white transition-colors"
                    />
                  </button>

                  {/* Performance Charts */}
                  {showPerformanceCharts && (
                    <button
                      onClick={() => scrollToSection("performance-charts")}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/30 transition-all text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <BarChart3 size={16} className="text-purple-400" />
                        <div>
                          <span className="text-white font-medium text-sm">
                            Performance Analytics
                          </span>
                          <p className="text-slate-400 text-xs">
                            Speed and token usage
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className="text-slate-400 group-hover:text-white transition-colors"
                      />
                    </button>
                  )}

                  {/* Model Results */}
                  {Object.entries(results.results || {})
                    .filter(([, data]: [string, any]) => !data.error)
                    .sort(
                      ([, a]: [string, any], [, b]: [string, any]) =>
                        (b.averageScore || 0) - (a.averageScore || 0)
                    )
                    .map(([modelId, data]: [string, any], index) => {
                      const modelInfo = AVAILABLE_MODELS.find(
                        (m) => m.id === modelId
                      );
                      const isWinner = results.comparison?.winner === modelId;
                      return (
                        <button
                          key={modelId}
                          onClick={() => scrollToSection(`model-${modelId}`)}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/30 transition-all text-left group"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                index === 0
                                  ? "bg-emerald-500"
                                  : index === 1
                                  ? "bg-blue-500"
                                  : "bg-slate-500"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="text-white font-medium text-sm">
                                  {modelInfo?.name || modelId}
                                </span>
                                {isWinner && (
                                  <Crown
                                    size={12}
                                    className="text-emerald-400"
                                  />
                                )}
                              </div>
                              <p className="text-slate-400 text-xs">
                                {(data.averageScore || 0).toFixed(1)}/10 score
                              </p>
                            </div>
                          </div>
                          <ChevronRight
                            size={16}
                            className="text-slate-400 group-hover:text-white transition-colors"
                          />
                        </button>
                      );
                    })}
                </div>
              </div>

              {results && !isLoading && (
                <div className="space-y-6">
                  {/* Winner Summary */}
                  {results.comparison && (
                    <div
                      id="analysis-summary"
                      className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 backdrop-blur-sm rounded-2xl border border-emerald-500/30 p-6"
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Crown size={20} className="text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-white">
                          Analysis Complete
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                          <p className="text-emerald-400 text-2xl font-bold">
                            {AVAILABLE_MODELS.find(
                              (m) => m.id === results.comparison.winner
                            )?.name || results.comparison.winner}
                          </p>
                          <p className="text-slate-400 text-sm">Winner</p>
                        </div>
                        <div className="text-center">
                          <p className="text-blue-400 text-2xl font-bold">
                            {results.comparison.scoreDifference}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Point Difference
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-400 text-2xl font-bold">
                            {results.metadata?.totalExecutionTime || 0}ms
                          </p>
                          <p className="text-slate-400 text-sm">Total Time</p>
                        </div>
                      </div>

                      {/* Key Insights Section */}
                      <div className="mt-6 pt-6 border-t border-slate-600/30">
                        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                            <span className="text-blue-400 text-sm">💡</span>
                          </div>
                          Key Insights
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            {/* Competition Level */}
                            <div className="bg-slate-700/20 rounded-lg p-4">
                              <h5 className="text-slate-300 font-medium text-sm mb-2">
                                Competition Level
                              </h5>
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {results.comparison.scoreDifference < 0.5
                                  ? "🔥 Extremely close race! Both models produced high-quality hooks with minimal differences."
                                  : results.comparison.scoreDifference < 1.5
                                  ? "⚡ Competitive results with some notable differences in approach and effectiveness."
                                  : "🏆 Clear winner emerged with significantly stronger performance across multiple criteria."}
                              </p>
                            </div>

                            {/* Overall Quality */}
                            <div className="bg-slate-700/20 rounded-lg p-4">
                              <h5 className="text-slate-300 font-medium text-sm mb-2">
                                Overall Quality
                              </h5>
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {(() => {
                                  const avgScore =
                                    Object.values(results.results).reduce(
                                      (acc: number, curr: any) =>
                                        acc + (curr.averageScore || 0),
                                      0
                                    ) / Object.keys(results.results).length;
                                  return avgScore >= 8
                                    ? "🌟 Excellent hook quality! Your content idea resonates well across all evaluation criteria."
                                    : avgScore >= 6.5
                                    ? "✅ Good hook quality with solid fundamentals. Some areas could be enhanced for maximum impact."
                                    : "⚠️ Moderate hook quality. Consider refining your content idea or trying different approaches.";
                                })()}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Model Strengths */}
                            <div className="bg-slate-700/20 rounded-lg p-4">
                              <h5 className="text-slate-300 font-medium text-sm mb-2">
                                Winning Approach
                              </h5>
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {(() => {
                                  const winnerModel = AVAILABLE_MODELS.find(
                                    (m) => m.id === results.comparison.winner
                                  );
                                  return winnerModel?.provider === "openai"
                                    ? "🎯 The winning model excelled in creativity and attention-grabbing elements, creating hooks with strong emotional appeal."
                                    : "🧠 The winning model demonstrated superior analytical thinking, creating well-structured hooks with clear value propositions.";
                                })()}
                              </p>
                            </div>

                            {/* Actionable Recommendation */}
                            <div className="bg-slate-700/20 rounded-lg p-4">
                              <h5 className="text-slate-300 font-medium text-sm mb-2">
                                Next Steps
                              </h5>
                              <p className="text-slate-200 text-sm leading-relaxed">
                                {(() => {
                                  const topScore = Math.max(
                                    ...Object.values(results.results).map(
                                      (d: any) => d.averageScore || 0
                                    )
                                  );
                                  return topScore >= 8.5
                                    ? "🚀 Your hooks are ready to publish! Consider A/B testing the top variations to optimize engagement."
                                    : topScore >= 7
                                    ? "📝 Refine the winning hook by incorporating suggestions from the analysis. Small tweaks can make a big difference."
                                    : "🔄 Try rephrasing your content idea with more specific outcomes, numbers, or emotional triggers for better results.";
                                })()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Performance Charts */}
                  {showPerformanceCharts && results.results && (
                    <div
                      id="performance-charts"
                      className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white flex items-center">
                          <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
                          Performance Analytics
                        </h3>
                        <button
                          onClick={() => setShowPerformanceCharts(false)}
                          className="text-slate-400 hover:text-white transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Score Comparison Chart */}
                        <div className="bg-slate-700/30 rounded-xl p-4">
                          <h4 className="text-white font-medium mb-4">
                            Average Scores
                          </h4>
                          <div className="space-y-3">
                            {Object.entries(results.results)
                              .filter(([, data]: [string, any]) => !data.error)
                              .sort(
                                ([, a]: [string, any], [, b]: [string, any]) =>
                                  (b.averageScore || 0) - (a.averageScore || 0)
                              )
                              .map(([modelId, data]: [string, any], index) => {
                                const modelInfo = AVAILABLE_MODELS.find(
                                  (m) => m.id === modelId
                                );
                                const score = data.averageScore || 0;
                                const maxScore = Math.max(
                                  ...Object.values(results.results).map(
                                    (d: any) => d.averageScore || 0
                                  )
                                );
                                const widthPercent = (score / maxScore) * 100;

                                return (
                                  <div
                                    key={modelId}
                                    className="flex items-center space-x-3"
                                  >
                                    <div className="w-20 text-sm text-slate-300 truncate">
                                      {modelInfo?.name || modelId}
                                    </div>
                                    <div className="flex-1 bg-slate-600 rounded-full h-3 relative">
                                      <div
                                        className={`h-3 rounded-full transition-all duration-500 ${
                                          index === 0
                                            ? "bg-emerald-500"
                                            : index === 1
                                            ? "bg-blue-500"
                                            : "bg-slate-400"
                                        }`}
                                        style={{ width: `${widthPercent}%` }}
                                      ></div>
                                    </div>
                                    <div className="w-12 text-sm text-slate-300 text-right">
                                      {score.toFixed(1)}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* Performance Metrics Chart */}
                        <div className="bg-slate-700/30 rounded-xl p-4">
                          <h4 className="text-white font-medium mb-4">
                            Performance Metrics
                          </h4>
                          <div className="space-y-4">
                            {/* Speed Chart */}
                            <div>
                              <h5 className="text-slate-300 text-sm mb-2">
                                Execution Time (ms)
                              </h5>
                              <div className="space-y-2">
                                {Object.entries(results.results)
                                  .filter(
                                    ([, data]: [string, any]) => !data.error
                                  )
                                  .sort(
                                    (
                                      [, a]: [string, any],
                                      [, b]: [string, any]
                                    ) =>
                                      (a.executionTime || 0) -
                                      (b.executionTime || 0)
                                  )
                                  .map(([modelId, data]: [string, any]) => {
                                    const modelInfo = AVAILABLE_MODELS.find(
                                      (m) => m.id === modelId
                                    );
                                    const time = data.executionTime || 0;
                                    const maxTime = Math.max(
                                      ...Object.values(results.results).map(
                                        (d: any) => d.executionTime || 0
                                      )
                                    );
                                    const widthPercent = (time / maxTime) * 100;

                                    return (
                                      <div
                                        key={modelId}
                                        className="flex items-center space-x-2 text-xs"
                                      >
                                        <div className="w-16 text-slate-400 truncate">
                                          {modelInfo?.name || modelId}
                                        </div>
                                        <div className="flex-1 bg-slate-600 rounded h-2">
                                          <div
                                            className="h-2 rounded bg-blue-400 transition-all duration-500"
                                            style={{
                                              width: `${widthPercent}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <div className="w-12 text-slate-400 text-right">
                                          {time}ms
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* Token Usage Chart */}
                            <div>
                              <h5 className="text-slate-300 text-sm mb-2">
                                Token Usage
                              </h5>
                              <div className="space-y-2">
                                {Object.entries(results.results)
                                  .filter(
                                    ([, data]: [string, any]) => !data.error
                                  )
                                  .map(([modelId, data]: [string, any]) => {
                                    const modelInfo = AVAILABLE_MODELS.find(
                                      (m) => m.id === modelId
                                    );
                                    const tokens = data.tokensUsed || 0;
                                    const maxTokens = Math.max(
                                      ...Object.values(results.results).map(
                                        (d: any) => d.tokensUsed || 0
                                      )
                                    );
                                    const widthPercent =
                                      maxTokens > 0
                                        ? (tokens / maxTokens) * 100
                                        : 0;

                                    return (
                                      <div
                                        key={modelId}
                                        className="flex items-center space-x-2 text-xs"
                                      >
                                        <div className="w-16 text-slate-400 truncate">
                                          {modelInfo?.name || modelId}
                                        </div>
                                        <div className="flex-1 bg-slate-600 rounded h-2">
                                          <div
                                            className="h-2 rounded bg-purple-400 transition-all duration-500"
                                            style={{
                                              width: `${widthPercent}%`,
                                            }}
                                          ></div>
                                        </div>
                                        <div className="w-12 text-slate-400 text-right">
                                          {tokens}
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Model Results */}
                  <div className="grid grid-cols-1 gap-6">
                    {Object.entries(results.results || {})
                      .filter(([, data]: [string, any]) => !data.error)
                      .sort(
                        ([, a]: [string, any], [, b]: [string, any]) =>
                          (b.averageScore || 0) - (a.averageScore || 0)
                      )
                      .map(([modelId, data]: [string, any], index) => {
                        const modelInfo = AVAILABLE_MODELS.find(
                          (m) => m.id === modelId
                        );
                        const isWinner = results.comparison?.winner === modelId;

                        return (
                          <div
                            key={modelId}
                            id={`model-${modelId}`}
                            className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border p-6 ${
                              isWinner
                                ? "border-emerald-500/50 shadow-emerald-500/10 shadow-2xl"
                                : "border-slate-700/50"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                                    index === 0
                                      ? "bg-emerald-500"
                                      : index === 1
                                      ? "bg-blue-500"
                                      : "bg-slate-500"
                                  }`}
                                >
                                  #{index + 1}
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-white">
                                    {modelInfo?.name || modelId}
                                  </h4>
                                  <div className="flex items-center space-x-2">
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${
                                        modelInfo?.provider === "openai"
                                          ? "bg-green-500/20 text-green-400"
                                          : "bg-purple-500/20 text-purple-400"
                                      }`}
                                    >
                                      {modelInfo?.provider || "unknown"}
                                    </span>
                                    {isWinner && (
                                      <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">
                                        Champion
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-3xl font-bold ${
                                    (data.averageScore || 0) >= 8
                                      ? "text-emerald-400"
                                      : (data.averageScore || 0) >= 6
                                      ? "text-blue-400"
                                      : "text-amber-400"
                                  }`}
                                >
                                  {(data.averageScore || 0).toFixed(1)}
                                </div>
                                <div className="text-slate-400 text-sm">
                                  Score
                                </div>
                              </div>
                            </div>

                            {/* Performance Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                <div className="text-blue-400 font-semibold">
                                  {data.executionTime || 0}ms
                                </div>
                                <div className="text-slate-400 text-xs">
                                  Speed
                                </div>
                              </div>
                              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                <div className="text-purple-400 font-semibold">
                                  {data.tokensUsed || 0}
                                </div>
                                <div className="text-slate-400 text-xs">
                                  Tokens
                                </div>
                              </div>
                              <div className="text-center p-3 bg-slate-700/30 rounded-lg">
                                <div className="text-amber-400 font-semibold">
                                  {data.judgeMetadata?.avgConfidence
                                    ? (
                                        data.judgeMetadata.avgConfidence * 10
                                      ).toFixed(0)
                                    : 85}
                                  %
                                </div>
                                <div className="text-slate-400 text-xs">
                                  Confidence
                                </div>
                              </div>
                            </div>

                            {/* Hooks */}
                            <div className="space-y-4">
                              <h5 className="text-sm font-medium text-slate-300 mb-3">
                                Generated Hooks
                              </h5>
                              {(data.hooks || []).map(
                                (hookData: any, hookIndex: number) => (
                                  <div
                                    key={hookIndex}
                                    className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <p className="text-white font-medium leading-relaxed flex-1">
                                        &ldquo;{hookData.hook}&rdquo;
                                      </p>
                                      <div
                                        className={`ml-4 text-xl font-bold ${
                                          (hookData.totalScore || 0) >= 8
                                            ? "text-emerald-400"
                                            : (hookData.totalScore || 0) >= 6
                                            ? "text-blue-400"
                                            : "text-amber-400"
                                        }`}
                                      >
                                        {(hookData.totalScore || 0).toFixed(1)}
                                      </div>
                                    </div>

                                    {hookData.judgeAnalysis && (
                                      <div className="mt-4 pt-4 border-t border-slate-600/50 space-y-6">
                                        {/* Analysis Details Section */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                          {/* Strengths */}
                                          {hookData.judgeAnalysis.strengths
                                            ?.length > 0 && (
                                            <div className="bg-slate-700/20 rounded-lg p-4 border border-emerald-500/20">
                                              <h6 className="text-emerald-400 text-sm font-medium mb-3 flex items-center">
                                                <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                                                Strengths
                                              </h6>
                                              <ul className="text-slate-300 text-sm space-y-2">
                                                {hookData.judgeAnalysis.strengths
                                                  .slice(0, 3)
                                                  .map(
                                                    (
                                                      strength: string,
                                                      i: number
                                                    ) => (
                                                      <li
                                                        key={i}
                                                        className="flex items-start space-x-2"
                                                      >
                                                        <span className="text-emerald-400 mt-1 text-xs">
                                                          ▶
                                                        </span>
                                                        <span className="leading-relaxed">
                                                          {strength}
                                                        </span>
                                                      </li>
                                                    )
                                                  )}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Recommendations */}
                                          {hookData.judgeAnalysis
                                            .recommendations?.length > 0 && (
                                            <div className="bg-slate-700/20 rounded-lg p-4 border border-blue-500/20">
                                              <h6 className="text-blue-400 text-sm font-medium mb-3 flex items-center">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                                                Suggestions
                                              </h6>
                                              <ul className="text-slate-300 text-sm space-y-2">
                                                {hookData.judgeAnalysis.recommendations
                                                  .slice(0, 3)
                                                  .map(
                                                    (
                                                      rec: string,
                                                      i: number
                                                    ) => (
                                                      <li
                                                        key={i}
                                                        className="flex items-start space-x-2"
                                                      >
                                                        <span className="text-blue-400 mt-1 text-xs">
                                                          ▶
                                                        </span>
                                                        <span className="leading-relaxed">
                                                          {rec}
                                                        </span>
                                                      </li>
                                                    )
                                                  )}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Weaknesses */}
                                          {hookData.judgeAnalysis.weaknesses
                                            ?.length > 0 && (
                                            <div className="bg-slate-700/20 rounded-lg p-4 border border-amber-500/20">
                                              <h6 className="text-amber-400 text-sm font-medium mb-3 flex items-center">
                                                <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                                                Areas to Improve
                                              </h6>
                                              <ul className="text-slate-300 text-sm space-y-2">
                                                {hookData.judgeAnalysis.weaknesses
                                                  .slice(0, 2)
                                                  .map(
                                                    (
                                                      weakness: string,
                                                      i: number
                                                    ) => (
                                                      <li
                                                        key={i}
                                                        className="flex items-start space-x-2"
                                                      >
                                                        <span className="text-amber-400 mt-1 text-xs">
                                                          ▶
                                                        </span>
                                                        <span className="leading-relaxed">
                                                          {weakness}
                                                        </span>
                                                      </li>
                                                    )
                                                  )}
                                              </ul>
                                            </div>
                                          )}
                                        </div>

                                        {/* Skill Tree Radar Chart - Full Width */}
                                        <div className="w-full">
                                          <HookRadarChart
                                            hookData={hookData}
                                            size={400}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Back to Navigation */}
                  <div className="bg-slate-700/20 rounded-2xl border border-slate-600/20 p-6 text-center">
                    <div className="flex items-center justify-center space-x-6">
                      <button
                        onClick={() => scrollToSection("table-of-contents")}
                        className="flex items-center space-x-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-colors"
                      >
                        <List size={18} />
                        <span>Back to Navigation</span>
                      </button>
                      <button
                        onClick={() =>
                          window.scrollTo({ top: 0, behavior: "smooth" })
                        }
                        className="flex items-center space-x-2 px-4 py-3 bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 hover:text-white rounded-lg transition-colors"
                      >
                        <ArrowUp size={18} />
                        <span>Back to Top</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Centered placeholder when not loading and no results */}
          {!isLoading && !results && (
            <div className="mt-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Search size={40} className="text-blue-400" />
              </div>
              <h3 className="text-2xl font-medium text-white mb-4">
                Ready to Generate Compelling Hooks
              </h3>
              <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
                Configure your LinkedIn post parameters above and let our AI
                models create powerful hooks that grab attention and drive
                engagement.
              </p>
            </div>
          )}

          {/* Configuration Panel - Moves to right sidebar when processing */}
          <div
            className={`transition-all duration-700 ease-in-out ${
              isLoading || results ? "lg:col-span-1 order-last" : "w-full"
            }`}
          >
            <div
              className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 transition-all duration-700 ${
                isLoading || results ? "sticky top-24" : ""
              }`}
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                Configuration
              </h2>

              {/* Post Idea Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Post Idea
                  </label>
                  <textarea
                    value={postIdea}
                    onChange={(e) => setPostIdea(e.target.value)}
                    placeholder="Describe your LinkedIn post idea..."
                    className="w-full h-32 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Industry */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Industry (Optional)
                  </label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g., Technology, Marketing"
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="tip">Tip/Advice</option>
                    <option value="story">Story/Experience</option>
                    <option value="announcement">Announcement</option>
                    <option value="question">Question/Discussion</option>
                  </select>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Audience
                  </label>
                  <select
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                {/* Model Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    AI Models ({selectedModels.length} selected)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {AVAILABLE_MODELS.map((model) => (
                      <label
                        key={model.id}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-slate-600/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedModels.includes(model.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModels([...selectedModels, model.id]);
                            } else {
                              setSelectedModels(
                                selectedModels.filter((m) => m !== model.id)
                              );
                            }
                          }}
                          className="mt-1 rounded border-slate-500 text-blue-500 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-medium">
                              {model.name}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${
                                model.provider === "openai"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-purple-500/20 text-purple-400"
                              }`}
                            >
                              {model.provider}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm mt-1">
                            {getModelDescription(model)}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={
                    !postIdea.trim() || selectedModels.length === 0 || isLoading
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    "Generate Hook Analysis"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
