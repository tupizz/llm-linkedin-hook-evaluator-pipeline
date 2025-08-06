import { BarChart3, Save } from "lucide-react";
import React from "react";
import { Button } from "../atoms";

interface HeaderProps {
  hasResults: boolean;
  isLoading: boolean;
  onSaveAnalysis: () => void;
  onShowJudgeAnalysis: () => void;
  onTogglePerformanceCharts: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasResults,
  isLoading,
  onSaveAnalysis,
  onShowJudgeAnalysis,
  onTogglePerformanceCharts,
}) => {
  return (
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
            {hasResults && !isLoading && (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={onSaveAnalysis}
                  variant="ghost"
                  size="sm"
                  icon={Save}
                  title="Save analysis data to file"
                >
                  Save
                </Button>

                <Button
                  onClick={onTogglePerformanceCharts}
                  variant="ghost"
                  size="sm"
                  icon={BarChart3}
                  title="Show performance charts"
                >
                  Charts
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
