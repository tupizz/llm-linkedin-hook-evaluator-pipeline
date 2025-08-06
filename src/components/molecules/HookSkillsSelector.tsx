import React from 'react';
import { Brain, Crown, Dumbbell, Heart, Target, Zap } from 'lucide-react';

export interface HookSkill {
  id: string;
  name: string;
  color: string;
  IconComponent: React.ComponentType<any>;
  description: string;
}

export const HOOK_SKILLS: HookSkill[] = [
  {
    id: 'attention_grabbing',
    name: 'Charisma',
    color: '#F59E0B',
    IconComponent: Zap,
    description: 'Captures attention and creates curiosity',
  },
  {
    id: 'emotional_impact',
    name: 'Empathy',
    color: '#EF4444',
    IconComponent: Heart,
    description: 'Triggers emotional responses',
  },
  {
    id: 'social_proof',
    name: 'Authority',
    color: '#8B5CF6',
    IconComponent: Crown,
    description: 'Leverages credibility and expertise',
  },
  {
    id: 'clarity_and_brevity',
    name: 'Wisdom',
    color: '#06B6D4',
    IconComponent: Brain,
    description: 'Clear and concise messaging',
  },
  {
    id: 'relevance_to_audience',
    name: 'Insight',
    color: '#10B981',
    IconComponent: Target,
    description: 'Relevant to target audience',
  },
  {
    id: 'actionability_promise',
    name: 'Power',
    color: '#F97316',
    IconComponent: Dumbbell,
    description: 'Promises actionable insights',
  },
];

interface HookSkillsSelectorProps {
  selectedSkills: string[];
  onSelectionChange: (skills: string[]) => void;
  maxSelections?: number;
}

export const HookSkillsSelector: React.FC<HookSkillsSelectorProps> = ({
  selectedSkills,
  onSelectionChange,
  maxSelections = 3,
}) => {
  const handleSkillToggle = (skillId: string) => {
    if (selectedSkills.includes(skillId)) {
      onSelectionChange(selectedSkills.filter(id => id !== skillId));
    } else if (selectedSkills.length < maxSelections) {
      onSelectionChange([...selectedSkills, skillId]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Focus Skills ({selectedSkills.length}/{maxSelections})
      </label>
      <p className="text-xs text-slate-400 mb-3">
        Select up to {maxSelections} skills to emphasize in generated hooks
      </p>
      <div className="grid grid-cols-2 gap-2">
        {HOOK_SKILLS.map((skill) => {
          const isSelected = selectedSkills.includes(skill.id);
          const isDisabled = !isSelected && selectedSkills.length >= maxSelections;
          
          return (
            <button
              key={skill.id}
              onClick={() => handleSkillToggle(skill.id)}
              disabled={isDisabled}
              className={`p-2 rounded-lg border transition-all text-left ${
                isSelected
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : isDisabled
                  ? 'border-slate-600/30 bg-slate-700/20 opacity-50 cursor-not-allowed'
                  : 'border-slate-600/30 hover:border-slate-500/50 hover:bg-slate-700/20'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: skill.color + '30' }}
                >
                  <skill.IconComponent 
                    size={12} 
                    color={skill.color}
                    strokeWidth={2.5}
                  />
                </div>
                <span className="text-white text-sm font-medium">
                  {skill.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-tight">
                {skill.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};