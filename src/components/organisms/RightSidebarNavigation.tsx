import { ScrollUtils } from "@/hooks/useScrollUtils";
import { ModelConfig } from "@/lib/unified-llm-service";
import {
  Brain,
  ChevronDown,
  ChevronRight,
  Crown,
  FileText,
  Lightbulb,
  Settings,
  Target,
  Users,
} from "lucide-react";
import React, { useState } from "react";
import { Button, Card } from "../atoms";

interface RightSidebarNavigationProps {
  results: any;
  availableModels: ModelConfig[];
  scrollUtils: ScrollUtils;
  userConfiguration: {
    postIdea: string;
    selectedModels: string[];
    focusSkills: string[];
    contentType: string;
    industry: string;
    targetAudience: string;
  };
  isLoading: boolean;
}

interface HookSelectionState {
  [modelId: string]: {
    [hookIndex: number]: boolean;
  };
}

export const RightSidebarNavigation: React.FC<RightSidebarNavigationProps> = ({
  results,
  availableModels,
  scrollUtils,
  userConfiguration,
  isLoading,
}) => {
  const [expandedModels, setExpandedModels] = useState<Set<string>>(new Set());
  const [selectedHooks, setSelectedHooks] = useState<HookSelectionState>({});

  const toggleModelExpansion = (modelId: string) => {
    const newExpanded = new Set(expandedModels);
    if (newExpanded.has(modelId)) {
      newExpanded.delete(modelId);
    } else {
      newExpanded.add(modelId);
    }
    setExpandedModels(newExpanded);
  };

  const toggleHookSelection = (modelId: string, hookIndex: number) => {
    setSelectedHooks((prev) => ({
      ...prev,
      [modelId]: {
        ...prev[modelId],
        [hookIndex]: !prev[modelId]?.[hookIndex],
      },
    }));
  };

  const getModelInfo = (modelId: string) => {
    return availableModels.find((m) => m.id === modelId);
  };

  const getSortedModels = () => {
    if (!results?.results) return [];

    return Object.entries(results.results)
      .filter(([, data]: [string, any]) => !data.error)
      .sort(
        ([, a]: [string, any], [, b]: [string, any]) =>
          (b.averageScore || 0) - (a.averageScore || 0)
      );
  };

  const getSelectedHooksCount = () => {
    let count = 0;
    Object.values(selectedHooks).forEach((modelHooks) => {
      Object.values(modelHooks).forEach((isSelected) => {
        if (isSelected) count++;
      });
    });
    return count;
  };

  return (
    <div className="space-y-3 pr-2">
      {/* Quick Navigation */}
      {results && (
        <Card variant="border" className="p-4 overflow-y-auto sidebar-section">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Crown size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Quick Navigation
              </h3>
            </div>
            <Button
              onClick={() => scrollUtils.scrollToSection("analysis-summary")}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              Summary
            </Button>
          </div>

          {/* Analysis Summary Link */}
          <button
            onClick={() => scrollUtils.scrollToSection("analysis-summary")}
            className="w-full p-2 mb-3 rounded-lg border border-slate-600/30 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left"
          >
            <div className="flex items-center space-x-2">
              <Crown size={14} className="text-emerald-400" />
              <div>
                <div className="text-xs font-medium text-white">
                  Analysis Summary
                </div>
                <div className="text-xs text-slate-400">
                  Winner and key insights
                </div>
              </div>
            </div>
          </button>

          {/* Model Results with Hook Selection */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 -mr-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Model Results
              </span>
              {getSelectedHooksCount() > 0 && (
                <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">
                  {getSelectedHooksCount()} selected
                </span>
              )}
            </div>

            {getSortedModels().map(([modelId, data]: [string, any], index) => {
              const modelInfo = getModelInfo(modelId);
              const isWinner = results.comparison?.winner === modelId;
              const isExpanded = expandedModels.has(modelId);
              const hooks = data.hooks || [];

              return (
                <div
                  key={modelId}
                  className="border border-slate-600/30 rounded-lg"
                >
                  {/* Model Header */}
                  <div className="flex items-center justify-between p-2">
                    <button
                      onClick={() =>
                        scrollUtils.scrollToSection(`model-${modelId}`)
                      }
                      className="flex items-center space-x-2 flex-1 text-left"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          index === 0
                            ? "bg-emerald-500"
                            : index === 1
                            ? "bg-blue-500"
                            : "bg-slate-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium text-white">
                            {modelInfo?.name || modelId}
                          </span>
                          {isWinner && (
                            <Crown size={10} className="text-emerald-400" />
                          )}
                        </div>
                        <div className="text-xs text-slate-400">
                          {(data.averageScore || 0).toFixed(1)}/10 •{" "}
                          {hooks.length} hooks
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => toggleModelExpansion(modelId)}
                      className="p-1 hover:bg-slate-700/50 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown size={12} className="text-slate-400" />
                      ) : (
                        <ChevronRight size={12} className="text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Hook List */}
                  {isExpanded && (
                    <div className="relative border-t border-slate-600/30">
                      <div className="p-2 space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                      {hooks.map((hook: any, hookIndex: number) => {
                        const isSelected =
                          selectedHooks[modelId]?.[hookIndex] || false;
                        const score = hook.totalScore || hook.judgeScore || 0;

                        return (
                          <div
                            key={hookIndex}
                            className={`p-2 rounded transition-all group ${
                              isSelected
                                ? "bg-slate-700/40"
                                : "hover:bg-slate-700/20"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              {/* Anchor Link */}
                              <button
                                className="flex items-start space-x-2 flex-1 pr-2 text-left cursor-pointer group/anchor"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollUtils.scrollToSection(
                                    `hook-${modelId}-${hookIndex}`
                                  );
                                }}
                                title={`Click to scroll to hook #${
                                  hookIndex + 1
                                }`}
                              >
                                {/* Hook Number */}
                                <div className="mt-0.5 w-4 flex justify-center">
                                  <span className="text-xs text-slate-500 font-mono">
                                    {hookIndex + 1}
                                  </span>
                                </div>

                                {/* Hook Content */}
                                <div className="flex-1">
                                  <div className="text-xs text-slate-300 line-clamp-2 hover:text-slate-200 transition-colors leading-relaxed mb-1">
                                    {hook.hook}
                                  </div>

                                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                                    <span>{score.toFixed(1)}</span>
                                    <span>•</span>
                                    <span>{hook.wordCount || 0}w</span>
                                  </div>
                                </div>
                              </button>

                              {/* Selection Checkbox */}
                              <div className="mt-1">
                                <button
                                  className={`w-3 h-3 rounded border transition-all ${
                                    isSelected
                                      ? "bg-slate-600 border-slate-600"
                                      : "border-slate-600 hover:border-slate-500"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleHookSelection(modelId, hookIndex);
                                  }}
                                  title={
                                    isSelected
                                      ? "Remove from selection"
                                      : "Add to selection"
                                  }
                                >
                                  {isSelected && (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                    </div>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      </div>
                      
                      {/* Gradient fade overlay - only show if there are many hooks */}
                      {hooks.length > 3 && (
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-800/90 via-slate-800/60 to-transparent pointer-events-none"></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* User Configuration Summary */}
      <Card variant="border" className="p-4 sidebar-section">
        <div className="flex items-center space-x-2 mb-3">
          <Settings size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-white">
            Current Configuration
          </h3>
        </div>

        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <Lightbulb size={12} className="text-yellow-400" />
            <span>Post Idea: </span>
            <span className="text-xs font-medium text-slate-400">
              &quot;{userConfiguration.postIdea}&quot;
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Brain size={12} className="text-purple-400" />
            <span>{userConfiguration.selectedModels.length} models</span>
            <span className="text-xs text-slate-400">
              ({userConfiguration.selectedModels.join(", ")})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Target size={12} className="text-green-400" />
            <span>{userConfiguration.focusSkills.length} focus skills</span>
            <span className="text-xs text-slate-400">
              ({userConfiguration.focusSkills.join(", ")})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <FileText size={12} className="text-blue-400" />
            <span>Type of Content: </span>
            <span className="text-xs text-slate-400">
              {userConfiguration.contentType}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Users size={12} className="text-orange-400" />
            <span>Target Audience: </span>
            <span className="text-xs text-slate-400">
              {userConfiguration.targetAudience}
            </span>
          </div>
        </div>

        {isLoading && (
          <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="text-xs text-blue-400 font-medium">
              ⚠️ Analysis in progress
            </div>
            <div className="text-xs text-slate-400">New analysis disabled</div>
          </div>
        )}
      </Card>

      {/* Export Selected Hooks */}
      {getSelectedHooksCount() > 0 && (
        <Card variant="border" className="p-3 sidebar-section">
          <div className="text-xs font-medium text-white mb-2">
            Selected Hooks
          </div>
          <div className="space-y-1">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const selectedText = Object.entries(selectedHooks)
                  .flatMap(([modelId, hooks]) =>
                    Object.entries(hooks)
                      .filter(([, isSelected]) => isSelected)
                      .map(([hookIndex]) => {
                        const modelData = results.results[modelId];
                        const hook = modelData.hooks[parseInt(hookIndex)];
                        const modelInfo = getModelInfo(modelId);
                        return `${modelInfo?.name || modelId}: ${hook.hook}`;
                      })
                  )
                  .join("\n\n");

                navigator.clipboard.writeText(selectedText);
              }}
            >
              Copy Selected ({getSelectedHooksCount()})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => setSelectedHooks({})}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
