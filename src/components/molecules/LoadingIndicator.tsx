import React from 'react';
import { Card, ProgressBar } from '../atoms';

interface LoadingIndicatorProps {
  currentStep: string;
  progress: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  currentStep,
  progress,
}) => {
  return (
    <Card className="mb-8">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        <h3 className="text-lg font-medium text-white">Processing</h3>
      </div>
      <p className="text-slate-400 mb-4">{currentStep}</p>
      <ProgressBar progress={progress} />
    </Card>
  );
};