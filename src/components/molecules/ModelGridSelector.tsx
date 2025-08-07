import { ModelConfig } from "@/lib/unified-llm-service";
import { Bot, Cpu, Sparkles, Zap } from "lucide-react";
import React from "react";

interface ModelGridSelectorProps {
  selectedModels: string[];
  availableModels: ModelConfig[];
  onSelectionChange: (models: string[]) => void;
  maxSelections?: number;
}

const getModelIcon = (model: ModelConfig) => {
  if (model.provider === "openai") {
    if (model.id.includes("o4") || model.id.includes("gpt-4.1")) {
      return Zap; // Advanced/premium models
    }
    return Bot; // Standard OpenAI models
  }
  return Cpu; // Anthropic models
};

const getModelDescription = (model: ModelConfig): string => {
  const descriptions: Record<string, string> = {
    gpt4o: "Most advanced with superior creativity",
    "gpt4o-mini": "Fast and cost-efficient",
    "o4-mini": "Reasoning-focused mini model",
    "gpt-4.1": "Flagship model for complex tasks",
    "claude-3-5-sonnet": "Flagship with excellent reasoning",
    "claude-3-5-haiku": "Lightning-fast processing",
  };
  return descriptions[model.id] || `${model.provider} model`;
};

export const ModelGridSelector: React.FC<ModelGridSelectorProps> = ({
  selectedModels,
  availableModels,
  onSelectionChange,
  maxSelections,
}) => {
  const handleModelToggle = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter((id) => id !== modelId));
    } else {
      if (!maxSelections || selectedModels.length < maxSelections) {
        onSelectionChange([...selectedModels, modelId]);
      }
    }
  };

  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-2">
        AI Models ({selectedModels.length} selected)
        {maxSelections && (
          <span className="text-slate-400 ml-1">(max {maxSelections})</span>
        )}
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {availableModels.map((model) => {
          const isSelected = selectedModels.includes(model.id);
          const isDisabled =
            maxSelections &&
            !isSelected &&
            selectedModels.length >= maxSelections;
          const IconComponent = getModelIcon(model);

          return (
            <button
              key={model.id}
              onClick={() => !isDisabled && handleModelToggle(model.id)}
              disabled={!!isDisabled}
              className={`relative p-2 rounded-lg border transition-all duration-200 text-left ${
                isSelected
                  ? "border-blue-400 bg-blue-400/10 text-blue-300"
                  : isDisabled
                  ? "border-slate-700 bg-slate-800/30 text-slate-500 cursor-not-allowed"
                  : "border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50"
              }`}
            >
              {model.new && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white bg-gradient-to-r from-fuchsia-600 via-pink-500 to-amber-400 shadow-lg ring-1 ring-white/20 animate-pulse">
                  <Sparkles size={12} className="opacity-90" />
                  New
                </span>
              )}
              <div className="flex items-start space-x-2">
                <IconComponent
                  size={14}
                  className={`mt-0.5 flex-shrink-0 ${
                    isSelected
                      ? "text-blue-400"
                      : isDisabled
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs leading-tight mb-1">
                    {model.name}
                  </div>
                  <div className="text-xs text-slate-400 leading-tight mb-1">
                    {getModelDescription(model)}
                  </div>
                  <span
                    className={`inline-block px-1 py-0.5 text-xs rounded ${
                      model.provider === "openai"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-purple-500/20 text-purple-400"
                    }`}
                  >
                    {model.provider}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
