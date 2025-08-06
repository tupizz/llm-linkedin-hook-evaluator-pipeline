import React from 'react';

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore = 10,
  size = 'md',
  showLabel = true,
}) => {
  const getScoreColor = () => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-emerald-400';
    if (percentage >= 60) return 'text-blue-400';
    return 'text-amber-400';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-lg';
      case 'md':
        return 'text-xl';
      case 'lg':
        return 'text-3xl';
      default:
        return 'text-xl';
    }
  };

  return (
    <div className="text-right">
      <div className={`font-bold ${getScoreColor()} ${getSizeClasses()}`}>
        {score.toFixed(1)}
      </div>
      {showLabel && (
        <div className="text-slate-400 text-sm">
          {size === 'lg' ? 'Score' : `/${maxScore}`}
        </div>
      )}
    </div>
  );
};