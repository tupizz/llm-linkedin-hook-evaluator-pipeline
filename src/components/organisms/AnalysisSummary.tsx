import React from 'react';
import { Crown } from 'lucide-react';
import { ModelConfig } from '@/lib/unified-llm-service';
import { Card } from '../atoms';
import { MetricCard } from '../molecules';

interface AnalysisSummaryProps {
  comparison: any;
  metadata: any;
  results: any;
  availableModels: ModelConfig[];
}

export const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  comparison,
  metadata,
  results,
  availableModels,
}) => {
  if (!comparison) return null;

  const winnerModel = availableModels.find((m) => m.id === comparison.winner);

  return (
    <Card 
      id="analysis-summary" 
      variant="gradient"
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          <Crown size={20} className="text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white">
          Analysis Complete
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          value={winnerModel?.name || comparison.winner}
          label="Winner"
          color="emerald"
        />
        <MetricCard
          value={comparison.scoreDifference}
          label="Point Difference"
          color="blue"
        />
        <MetricCard
          value={`${metadata?.totalExecutionTime || 0}ms`}
          label="Total Time"
          color="purple"
        />
      </div>

      {/* Key Insights Section */}
      <div className="mt-6 pt-6 border-t border-slate-600/30">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
          <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
            <span className="text-blue-400 text-sm">💡</span>
          </div>
          Key Insights
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            {/* Competition Level */}
            <div className="bg-slate-700/20 rounded-lg p-4">
              <h5 className="text-slate-300 font-medium text-sm mb-2">
                Competition Level
              </h5>
              <p className="text-slate-200 text-sm leading-relaxed">
                {comparison.scoreDifference < 0.5
                  ? "🔥 Extremely close race! Both models produced high-quality hooks with minimal differences."
                  : comparison.scoreDifference < 1.5
                  ? "⚡ Competitive results with some notable differences in approach and effectiveness."
                  : "🏆 Clear winner emerged with significantly stronger performance across multiple criteria."}
              </p>
            </div>

            {/* Overall Quality */}
            <div className="bg-slate-700/20 rounded-lg p-4">
              <h5 className="text-slate-300 font-medium text-sm mb-2">
                Overall Quality
              </h5>
              <p className="text-slate-200 text-sm leading-relaxed">
                {(() => {
                  const avgScore =
                    Object.values(results).reduce(
                      (acc: number, curr: any) =>
                        acc + (curr.averageScore || 0),
                      0
                    ) / Object.keys(results).length;
                  return avgScore >= 8
                    ? "🌟 Excellent hook quality! Your content idea resonates well across all evaluation criteria."
                    : avgScore >= 6.5
                    ? "✅ Good hook quality with solid fundamentals. Some areas could be enhanced for maximum impact."
                    : "⚠️ Moderate hook quality. Consider refining your content idea or trying different approaches.";
                })()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Model Strengths */}
            <div className="bg-slate-700/20 rounded-lg p-4">
              <h5 className="text-slate-300 font-medium text-sm mb-2">
                Winning Approach
              </h5>
              <p className="text-slate-200 text-sm leading-relaxed">
                {(() => {
                  return winnerModel?.provider === "openai"
                    ? "🎯 The winning model excelled in creativity and attention-grabbing elements, creating hooks with strong emotional appeal."
                    : "🧠 The winning model demonstrated superior analytical thinking, creating well-structured hooks with clear value propositions.";
                })()}
              </p>
            </div>

            {/* Actionable Recommendation */}
            <div className="bg-slate-700/20 rounded-lg p-4">
              <h5 className="text-slate-300 font-medium text-sm mb-2">
                Next Steps
              </h5>
              <p className="text-slate-200 text-sm leading-relaxed">
                {(() => {
                  const topScore = Math.max(
                    ...Object.values(results).map(
                      (d: any) => d.averageScore || 0
                    )
                  );
                  return topScore >= 8.5
                    ? "🚀 Your hooks are ready to publish! Consider A/B testing the top variations to optimize engagement."
                    : topScore >= 7
                    ? "📝 Refine the winning hook by incorporating suggestions from the analysis. Small tweaks can make a big difference."
                    : "🔄 Try rephrasing your content idea with more specific outcomes, numbers, or emotional triggers for better results.";
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};