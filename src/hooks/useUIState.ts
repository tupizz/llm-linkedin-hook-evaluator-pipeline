import { useState } from 'react';

export interface UIState {
  showJudgeAnalysis: boolean;
  showPerformanceCharts: boolean;
}

export interface UIActions {
  setShowJudgeAnalysis: (show: boolean) => void;
  setShowPerformanceCharts: (show: boolean) => void;
  togglePerformanceCharts: () => void;
}

export function useUIState(): UIState & UIActions {
  const [showJudgeAnalysis, setShowJudgeAnalysis] = useState(false);
  const [showPerformanceCharts, setShowPerformanceCharts] = useState(false);

  const togglePerformanceCharts = () => {
    setShowPerformanceCharts(!showPerformanceCharts);
  };

  return {
    // State
    showJudgeAnalysis,
    showPerformanceCharts,
    
    // Actions
    setShowJudgeAnalysis,
    setShowPerformanceCharts,
    togglePerformanceCharts,
  };
}