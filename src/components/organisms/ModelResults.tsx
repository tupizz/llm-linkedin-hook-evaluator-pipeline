import HookRadarChart from "@/components/atoms/HookRadarChart";
import { ModelConfig } from "@/lib/unified-llm-service";
import { AlertCircle, ArrowRight, CheckCircle2, Crown } from "lucide-react";
import React from "react";
import { Badge, Card } from "../atoms";
import { MetricCard, ScoreDisplay } from "../molecules";

interface ModelResultsProps {
  results: any;
  comparison: any;
  availableModels: ModelConfig[];
}

export const ModelResults: React.FC<ModelResultsProps> = ({
  results,
  comparison,
  availableModels,
}) => {
  if (!results) return null;

  return (
    <div className="grid grid-cols-1 gap-6">
      {Object.entries(results)
        .filter(([, data]: [string, any]) => !data.error)
        .sort(
          ([, a]: [string, any], [, b]: [string, any]) =>
            (b.averageScore || 0) - (a.averageScore || 0)
        )
        .map(([modelId, data]: [string, any], index) => {
          const modelInfo = availableModels.find((m) => m.id === modelId);
          const isWinner = comparison?.winner === modelId;

          return (
            <Card
              key={modelId}
              id={`model-${modelId}`}
              className={`${
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
                      <Badge
                        variant={
                          modelInfo?.provider === "openai"
                            ? "openai"
                            : "anthropic"
                        }
                      >
                        {modelInfo?.provider || "unknown"}
                      </Badge>
                      {isWinner && (
                        <Badge variant="success">
                          <Crown size={12} className="mr-1" />
                          Champion
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <ScoreDisplay score={data.averageScore || 0} size="lg" />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <MetricCard
                  value={`${data.executionTime || 0}ms`}
                  label="Speed"
                  color="blue"
                />
                <MetricCard
                  value={data.tokensUsed || 0}
                  label="Tokens"
                  color="purple"
                />
                <MetricCard
                  value={`${
                    data.judgeMetadata?.avgConfidence
                      ? (data.judgeMetadata.avgConfidence * 10).toFixed(0)
                      : 85
                  }%`}
                  label="Confidence"
                  color="amber"
                />
              </div>

              {/* Hooks */}
              <div className="space-y-4">
                <h5 className="text-sm font-medium text-slate-300 mb-3">
                  Generated Hooks
                </h5>
                {(data.hooks || []).map((hookData: any, hookIndex: number) => (
                  <div
                    key={hookIndex}
                    id={`hook-${modelId}-${hookIndex}`}
                    className="p-4 bg-slate-700/30 rounded-lg border border-slate-600/50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 pr-4">
                        <div className="relative p-1">
                          {/* Hook text with enhanced typography */}
                          <blockquote className="text-2xl font-bold leading-snug tracking-tight relative">
                            {/* Main hook text with better contrast */}
                            <span className="relative z-10 font-serif drop-shadow-sm text-white">
                              &quot;{hookData.hook}&quot;
                            </span>
                          </blockquote>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <ScoreDisplay score={hookData.totalScore || 0} />
                      </div>
                    </div>

                    {hookData.judgeAnalysis && (
                      <div className="mt-4 pt-4 border-t border-slate-600/50 space-y-6">
                        {/* Analysis Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Strengths */}
                          {hookData.judgeAnalysis.strengths?.length > 0 && (
                            <div className="bg-slate-700/10 rounded p-3 border border-slate-600/20">
                              <h6 className="text-slate-300 text-xs font-medium mb-2 flex items-center">
                                <CheckCircle2
                                  size={12}
                                  className="text-slate-400 mr-2"
                                />
                                Strengths
                              </h6>
                              <ul className="text-slate-400 text-xs space-y-1">
                                {hookData.judgeAnalysis.strengths
                                  .slice(0, 3)
                                  .map((strength: string, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start space-x-2"
                                    >
                                      <span className="text-slate-500 mt-0.5 text-xs">
                                        •
                                      </span>
                                      <span className="leading-relaxed">
                                        {strength}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* Recommendations */}
                          {hookData.judgeAnalysis.recommendations?.length >
                            0 && (
                            <div className="bg-slate-700/10 rounded p-3 border border-slate-600/20">
                              <h6 className="text-slate-300 text-xs font-medium mb-2 flex items-center">
                                <ArrowRight
                                  size={12}
                                  className="text-slate-400 mr-2"
                                />
                                Suggestions
                              </h6>
                              <ul className="text-slate-400 text-xs space-y-1">
                                {hookData.judgeAnalysis.recommendations
                                  .slice(0, 3)
                                  .map((rec: string, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start space-x-2"
                                    >
                                      <span className="text-slate-500 mt-0.5 text-xs">
                                        •
                                      </span>
                                      <span className="leading-relaxed">
                                        {rec}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* Weaknesses */}
                          {hookData.judgeAnalysis.weaknesses?.length > 0 && (
                            <div className="bg-slate-700/10 rounded p-3 border border-slate-600/20">
                              <h6 className="text-slate-300 text-xs font-medium mb-2 flex items-center">
                                <AlertCircle
                                  size={12}
                                  className="text-slate-400 mr-2"
                                />
                                Areas to Improve
                              </h6>
                              <ul className="text-slate-400 text-xs space-y-1">
                                {hookData.judgeAnalysis.weaknesses
                                  .slice(0, 2)
                                  .map((weakness: string, i: number) => (
                                    <li
                                      key={i}
                                      className="flex items-start space-x-2"
                                    >
                                      <span className="text-slate-500 mt-0.5 text-xs">
                                        •
                                      </span>
                                      <span className="leading-relaxed">
                                        {weakness}
                                      </span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Skill Tree Radar Chart - Full Width */}
                        <div className="w-full">
                          <HookRadarChart hookData={hookData} size={400} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
    </div>
  );
};
