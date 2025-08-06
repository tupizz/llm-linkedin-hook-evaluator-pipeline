import React from 'react';
import { ModelConfig } from '@/lib/unified-llm-service';
import { Badge } from '../atoms';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  getModelDescription: (model: ModelConfig) => string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModels,
  onSelectionChange,
  getModelDescription,
}) => {
  const handleModelToggle = (modelId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedModels, modelId]);
    } else {
      onSelectionChange(selectedModels.filter((m) => m !== modelId));
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300 mb-3">
        AI Models ({selectedModels.length} selected)
      </label>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {models.map((model) => (
          <label
            key={model.id}
            className="flex items-start space-x-3 p-3 rounded-lg border border-slate-600/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedModels.includes(model.id)}
              onChange={(e) => handleModelToggle(model.id, e.target.checked)}
              className="mt-1 rounded border-slate-500 text-blue-500 focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-white font-medium">{model.name}</span>
                <Badge variant={model.provider === "openai" ? "openai" : "anthropic"}>
                  {model.provider}
                </Badge>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                {getModelDescription(model)}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};