import React from 'react';
import { List, ArrowUp, Crown, BarChart3 } from 'lucide-react';
import { ModelConfig } from '@/lib/unified-llm-service';
import { Card, Button } from '../atoms';
import { NavigationButton } from '../molecules';
import { ScrollUtils } from '@/hooks/useScrollUtils';

interface TableOfContentsProps {
  results: any;
  availableModels: ModelConfig[];
  showPerformanceCharts: boolean;
  scrollUtils: ScrollUtils;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  results,
  availableModels,
  showPerformanceCharts,
  scrollUtils,
}) => {
  return (
    <Card id="table-of-contents" variant="border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
            <List size={18} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Quick Navigation</h3>
        </div>
        <Button
          onClick={scrollUtils.scrollToTop}
          variant="ghost"
          size="sm"
          icon={ArrowUp}
          title="Back to top"
        >
          Top
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Overview Section */}
        <NavigationButton
          icon={Crown}
          title="Analysis Summary"
          subtitle="Winner and key metrics"
          onClick={() => scrollUtils.scrollToSection('analysis-summary')}
          iconColor="text-emerald-400"
        />

        {/* Performance Charts */}
        {showPerformanceCharts && (
          <NavigationButton
            icon={BarChart3}
            title="Performance Analytics"
            subtitle="Speed and token usage"
            onClick={() => scrollUtils.scrollToSection('performance-charts')}
            iconColor="text-purple-400"
          />
        )}

        {/* Model Results */}
        {Object.entries(results.results || {})
          .filter(([, data]: [string, any]) => !data.error)
          .sort(
            ([, a]: [string, any], [, b]: [string, any]) =>
              (b.averageScore || 0) - (a.averageScore || 0)
          )
          .map(([modelId, data]: [string, any], index) => {
            const modelInfo = availableModels.find((m) => m.id === modelId);
            const isWinner = results.comparison?.winner === modelId;
            return (
              <div key={modelId} className="flex items-center justify-between p-3 rounded-lg border border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/30 transition-all">
                <button
                  onClick={() => scrollUtils.scrollToSection(`model-${modelId}`)}
                  className="flex items-center space-x-3 flex-1 text-left"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      index === 0
                        ? 'bg-emerald-500'
                        : index === 1
                        ? 'bg-blue-500'
                        : 'bg-slate-500'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-medium text-sm">
                        {modelInfo?.name || modelId}
                      </span>
                      {isWinner && <Crown size={12} className="text-emerald-400" />}
                    </div>
                    <p className="text-slate-400 text-xs">
                      {(data.averageScore || 0).toFixed(1)}/10 score
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
      </div>
    </Card>
  );
};