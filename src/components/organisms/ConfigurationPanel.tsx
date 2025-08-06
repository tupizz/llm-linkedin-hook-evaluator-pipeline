import { ModelConfig } from "@/lib/unified-llm-service";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { Button, Card } from "../atoms";
import { HookSkillsSelector, ModelGridSelector } from "../molecules";

interface ConfigurationPanelProps {
  postIdea: string;
  industry: string;
  targetAudience: string;
  contentType: string;
  selectedModels: string[];
  focusSkills: string[];
  availableModels: ModelConfig[];
  isLoading: boolean;
  hasResults: boolean;
  onPostIdeaChange: (value: string) => void;
  onIndustryChange: (value: string) => void;
  onTargetAudienceChange: (value: string) => void;
  onContentTypeChange: (value: string) => void;
  onSelectedModelsChange: (models: string[]) => void;
  onFocusSkillsChange: (skills: string[]) => void;
  onGenerate: () => void;
}

const contentTypeOptions = [
  { value: "tip", label: "Tip/Advice" },
  { value: "story", label: "Story/Experience" },
  { value: "announcement", label: "Announcement" },
  { value: "question", label: "Question/Discussion" },
];

const audienceOptions = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  postIdea,
  industry,
  targetAudience,
  contentType,
  selectedModels,
  focusSkills,
  availableModels,
  isLoading,
  hasResults,
  onPostIdeaChange,
  onIndustryChange,
  onTargetAudienceChange,
  onContentTypeChange,
  onSelectedModelsChange,
  onFocusSkillsChange,
  onGenerate,
}) => {
  const isSticky = isLoading || hasResults;
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Card
      className={`transition-all duration-700 ${
        isSticky ? "sticky top-24" : ""
      } h-fit max-h-screen overflow-y-auto`}
    >
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
        Configuration
      </h2>

      <div className="space-y-3">
        {/* Post Idea - Compact */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Post Idea *
          </label>
          <textarea
            value={postIdea}
            onChange={(e) => onPostIdeaChange(e.target.value)}
            placeholder="Describe your LinkedIn post idea..."
            className="w-full h-20 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Compact Row - Content Type & Audience */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => onContentTypeChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {contentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => onTargetAudienceChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {audienceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Hook Skills Selector */}
        <HookSkillsSelector
          selectedSkills={focusSkills}
          onSelectionChange={onFocusSkillsChange}
          maxSelections={3}
        />

        {/* AI Models Grid */}
        <ModelGridSelector
          selectedModels={selectedModels}
          availableModels={availableModels}
          onSelectionChange={onSelectedModelsChange}
        />

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full p-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          <span>Advanced Options</span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Advanced Section */}
        {showAdvanced && (
          <div className="space-y-2 pb-2 border-t border-slate-600/30 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Industry (Optional)
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => onIndustryChange(e.target.value)}
                placeholder="e.g., Technology, Marketing"
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={onGenerate}
          disabled={
            !postIdea.trim() || selectedModels.length === 0 || isLoading
          }
          variant="primary"
          size="sm"
          className="w-full mt-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Generating...</span>
            </div>
          ) : (
            "Generate Hook Analysis"
          )}
        </Button>
      </div>
    </Card>
  );
};
