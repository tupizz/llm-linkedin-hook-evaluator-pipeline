import React from 'react';
import { X } from 'lucide-react';
import { ModelConfig } from '@/lib/unified-llm-service';
import { Card, Button } from '../atoms';

interface PerformanceChartsProps {
  results: any;
  availableModels: ModelConfig[];
  onClose: () => void;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  results,
  availableModels,
  onClose,
}) => {
  if (!results) return null;

  return (
    <Card id="performance-charts">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <span className="w-2 h-2 bg-purple-400 rounded-full mr-3"></span>
          Performance Analytics
        </h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          icon={X}
          className="text-slate-400 hover:text-white"
        >
          Close
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Score Comparison Chart */}
        <div className="bg-slate-700/30 rounded-xl p-4">
          <h4 className="text-white font-medium mb-4">Average Scores</h4>
          <div className="space-y-3">
            {Object.entries(results)
              .filter(([, data]: [string, any]) => !data.error)
              .sort(
                ([, a]: [string, any], [, b]: [string, any]) =>
                  (b.averageScore || 0) - (a.averageScore || 0)
              )
              .map(([modelId, data]: [string, any], index) => {
                const modelInfo = availableModels.find((m) => m.id === modelId);
                const score = data.averageScore || 0;
                const maxScore = Math.max(
                  ...Object.values(results).map((d: any) => d.averageScore || 0)
                );
                const widthPercent = (score / maxScore) * 100;

                return (
                  <div key={modelId} className="flex items-center space-x-3">
                    <div className="w-20 text-sm text-slate-300 truncate">
                      {modelInfo?.name || modelId}
                    </div>
                    <div className="flex-1 bg-slate-600 rounded-full h-3 relative">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          index === 0
                            ? 'bg-emerald-500'
                            : index === 1
                            ? 'bg-blue-500'
                            : 'bg-slate-400'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
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
          <h4 className="text-white font-medium mb-4">Performance Metrics</h4>
          <div className="space-y-4">
            {/* Speed Chart */}
            <div>
              <h5 className="text-slate-300 text-sm mb-2">Execution Time (ms)</h5>
              <div className="space-y-2">
                {Object.entries(results)
                  .filter(([, data]: [string, any]) => !data.error)
                  .sort(
                    ([, a]: [string, any], [, b]: [string, any]) =>
                      (a.executionTime || 0) - (b.executionTime || 0)
                  )
                  .map(([modelId, data]: [string, any]) => {
                    const modelInfo = availableModels.find((m) => m.id === modelId);
                    const time = data.executionTime || 0;
                    const maxTime = Math.max(
                      ...Object.values(results).map((d: any) => d.executionTime || 0)
                    );
                    const widthPercent = (time / maxTime) * 100;

                    return (
                      <div key={modelId} className="flex items-center space-x-2 text-xs">
                        <div className="w-16 text-slate-400 truncate">
                          {modelInfo?.name || modelId}
                        </div>
                        <div className="flex-1 bg-slate-600 rounded h-2">
                          <div
                            className="h-2 rounded bg-blue-400 transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
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
              <h5 className="text-slate-300 text-sm mb-2">Token Usage</h5>
              <div className="space-y-2">
                {Object.entries(results)
                  .filter(([, data]: [string, any]) => !data.error)
                  .map(([modelId, data]: [string, any]) => {
                    const modelInfo = availableModels.find((m) => m.id === modelId);
                    const tokens = data.tokensUsed || 0;
                    const maxTokens = Math.max(
                      ...Object.values(results).map((d: any) => d.tokensUsed || 0)
                    );
                    const widthPercent = maxTokens > 0 ? (tokens / maxTokens) * 100 : 0;

                    return (
                      <div key={modelId} className="flex items-center space-x-2 text-xs">
                        <div className="w-16 text-slate-400 truncate">
                          {modelInfo?.name || modelId}
                        </div>
                        <div className="flex-1 bg-slate-600 rounded h-2">
                          <div
                            className="h-2 rounded bg-purple-400 transition-all duration-500"
                            style={{ width: `${widthPercent}%` }}
                          />
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
    </Card>
  );
};