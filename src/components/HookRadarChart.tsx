"use client";

import { Brain, Crown, Dumbbell, Heart, Target, Zap } from "lucide-react";
import React from "react";

interface SkillAttribute {
  name: string;
  value: number;
  color: string;
  IconComponent: React.ComponentType<any>;
  description: string;
  example: string;
}

interface HookRadarChartProps {
  hookData: {
    hook: string;
    judgeAnalysis?: {
      criteriaResults?: Array<{
        criterion: string;
        score: number;
        reasoning: string;
        confidence: number;
      }>;
      criteriaBreakdown?: Array<{
        criterion: string;
        score: number;
        reasoning: string;
        confidence: number;
      }>;
    };
  };
  size?: number;
}

// Map LinkedIn criteria to RPG-style attributes with descriptions
const mapCriteriaToSkills = (
  criteriaResults: Array<{
    criterion: string;
    score: number;
    reasoning: string;
    confidence: number;
  }>
): SkillAttribute[] => {
  const skillMap: Record<
    string,
    {
      name: string;
      color: string;
      IconComponent: React.ComponentType<any>;
      description: string;
      example: string;
    }
  > = {
    attention_grabbing: {
      name: "Charisma",
      color: "#F59E0B",
      IconComponent: Zap,
      description: "How well the hook captures attention and creates curiosity",
      example:
        'Strong charisma: "I made $50K in 30 days using this LinkedIn strategy"',
    },
    emotional_impact: {
      name: "Empathy",
      color: "#EF4444",
      IconComponent: Heart,
      description:
        "Ability to trigger emotional responses like surprise, curiosity, or excitement",
      example:
        'High empathy: "The mistake that cost me $100K in my first startup"',
    },
    social_proof: {
      name: "Authority",
      color: "#8B5CF6",
      IconComponent: Crown,
      description: "Leverages credibility, expertise, or social validation",
      example:
        'Strong authority: "After 10 years as a Google PM, here\'s what I learned"',
    },
    clarity_and_brevity: {
      name: "Wisdom",
      color: "#06B6D4",
      IconComponent: Brain,
      description: "Clear, concise messaging that's easy to understand",
      example: 'High wisdom: "3 LinkedIn hacks that doubled my reach"',
    },
    relevance_to_audience: {
      name: "Insight",
      color: "#10B981",
      IconComponent: Target,
      description:
        "How relevant and valuable the content is to LinkedIn professionals",
      example: 'Strong insight: "How I automated my B2B sales pipeline"',
    },
    actionability_promise: {
      name: "Power",
      color: "#F97316",
      IconComponent: Dumbbell,
      description:
        "Promises actionable insights or valuable information readers can use",
      example:
        'High power: "The 5-step process I use to close enterprise deals"',
    },
  };

  return criteriaResults.map((result) => {
    // Normalize criterion key to lowercase
    const normalizedKey = result.criterion.toLowerCase();
    const skillInfo = skillMap[normalizedKey] || {
      name: result.criterion,
      color: "#6B7280",
      IconComponent: Target,
      description: "LinkedIn content evaluation criterion",
      example: "No example available",
    };

    return {
      name: skillInfo.name,
      value: result.score,
      color: skillInfo.color,
      IconComponent: skillInfo.IconComponent,
      description: skillInfo.description,
      example: skillInfo.example,
    };
  });
};

const HookRadarChart: React.FC<HookRadarChartProps> = ({
  hookData,
  size = 240,
}) => {
  const [hoveredSkill, setHoveredSkill] = React.useState<SkillAttribute | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = React.useState({
    x: 0,
    y: 0,
    placement: "top" as "top" | "bottom" | "left" | "right" | "center",
  });

  const criteriaData =
    hookData.judgeAnalysis?.criteriaResults ||
    hookData.judgeAnalysis?.criteriaBreakdown;

  if (!criteriaData || criteriaData.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-32 bg-slate-700/30 rounded-lg">
        <span className="text-slate-400 text-sm">No skill data available</span>
      </div>
    );
  }

  const skills = mapCriteriaToSkills(criteriaData);
  const maxValue = 10;
  const center = size / 2;
  const radius = center - 60; // More padding for labels
  const skillValues = skills.map((s) => s.value);
  const averageScore =
    skillValues.reduce((a, b) => a + b, 0) / skillValues.length;

  const handleSkillHover = (skill: SkillAttribute, event: React.MouseEvent) => {
    setHoveredSkill(skill);
    // Get the container element's bounding rect for proper positioning
    const containerRect = event.currentTarget
      .closest(".radar-chart-container")
      ?.getBoundingClientRect();
    const targetRect = event.currentTarget.getBoundingClientRect();

    if (containerRect) {
      const relativeX =
        targetRect.left - containerRect.left + targetRect.width / 2;
      const relativeY =
        targetRect.top - containerRect.top + targetRect.height / 2;

      // Determine which quadrant/side the skill is on relative to center
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;

      const deltaX = relativeX - containerCenterX;
      const deltaY = relativeY - containerCenterY;

      // Determine placement based on position
      let placement: "top" | "bottom" | "left" | "right" | "center" = "top";

      // Use angles to determine more precise placement
      const angle = Math.atan2(deltaY, deltaX);
      const degrees = ((angle * 180) / Math.PI + 360) % 360;

      if (degrees >= 315 || degrees < 45) {
        placement = "left"; // Right side skills - tooltip on left
      } else if (degrees >= 45 && degrees < 135) {
        placement = "top"; // Bottom skills - tooltip on top
      } else if (degrees >= 135 && degrees < 225) {
        placement = "right"; // Left side skills - tooltip on right
      } else {
        placement = "bottom"; // Top skills - tooltip on bottom
      }

      setTooltipPosition({
        x: relativeX,
        y: relativeY,
        placement,
      });
    }
  };

  const handleSkillLeave = () => {
    setHoveredSkill(null);
  };

  // Generate points for the radar chart
  const generatePolygonPoints = (values: number[]) => {
    const angleStep = (2 * Math.PI) / values.length;
    return values
      .map((value, index) => {
        const angle = angleStep * index - Math.PI / 2;
        const scaledValue = (value / maxValue) * radius;
        const x = center + scaledValue * Math.cos(angle);
        const y = center + scaledValue * Math.sin(angle);
        return `${x},${y}`;
      })
      .join(" ");
  };

  // Generate axis lines
  const generateAxisLines = () => {
    const angleStep = (2 * Math.PI) / skills.length;
    return skills.map((_, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x2 = center + radius * Math.cos(angle);
      const y2 = center + radius * Math.sin(angle);
      return (
        <line
          key={index}
          x1={center}
          y1={center}
          x2={x2}
          y2={y2}
          stroke="#475569"
          strokeWidth="1.5"
          opacity="0.4"
        />
      );
    });
  };

  // Generate concentric circles with score labels
  const generateGridCircles = () => {
    const scales = [0.2, 0.4, 0.6, 0.8, 1.0];
    return scales.map((scale, index) => (
      <g key={index}>
        <circle
          cx={center}
          cy={center}
          r={radius * scale}
          fill="none"
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray={index === 4 ? "none" : "2,3"}
          opacity={"0.4"}
        />

        <text
          x={center + 10}
          y={center - radius * scale + 4}
          fontSize="12"
          fill="#64748B"
          opacity="0.5"
          fontWeight="500"
        >
          {(scale * maxValue).toFixed(0)}
        </text>
      </g>
    ));
  };

  const polygonPoints = generatePolygonPoints(skillValues);

  return (
    <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 rounded-xl p-5 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-white font-semibold text-base flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
          Hook Skills
        </h4>
        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-medium">Average:</span>
          <div
            className={`px-2 py-1 rounded-full text-sm font-bold border ${
              averageScore >= 8
                ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
                : averageScore >= 6
                ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
                : "text-amber-400 bg-amber-400/10 border-amber-400/30"
            }`}
          >
            {averageScore.toFixed(1)}
          </div>
        </div>
      </div>

      <div className="flex justify-center radar-chart-container relative">
        <svg
          width={size}
          height={size + 40}
          className="drop-shadow-lg"
          style={{ overflow: "visible" }}
        >
          {/* Background grid */}
          <g transform={`translate(0, 20)`}>
            {generateGridCircles()}
            {generateAxisLines()}

            {/* Skill area with glow effect */}
            <polygon
              points={polygonPoints}
              fill="url(#skillGradient)"
              stroke="url(#skillStroke)"
              strokeWidth="2"
              opacity="0.6"
            />

            {/* Secondary polygon for depth */}
            <polygon
              points={polygonPoints}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="1"
              opacity="0.3"
              strokeDasharray="5,3"
            />

            {/* Skill points on data with enhanced styling */}
            {skills.map((skill, index) => {
              const angleStep = (2 * Math.PI) / skills.length;
              const angle = angleStep * index - Math.PI / 2;
              const scaledValue = (skill.value / maxValue) * radius;
              const x = center + scaledValue * Math.cos(angle);
              const y = center + scaledValue * Math.sin(angle);

              return (
                <g key={`point-${index}`}>
                  {/* Main point */}
                  <circle
                    cx={x}
                    cy={y}
                    r="6"
                    fill={`url(#pointGradient-${index})`}
                    stroke="white"
                    strokeWidth="2.5"
                    className="drop-shadow-lg cursor-pointer hover:r-7 transition-all duration-300"
                    filter="url(#pointShadow)"
                  />
                  {/* Inner highlight */}
                  <circle
                    cx={x - 1}
                    cy={y - 1}
                    r="2"
                    fill="rgba(255,255,255,0.6)"
                  />
                </g>
              );
            })}

            {/* Skill labels and icons positioned in SVG */}
            {skills.map((skill, index) => {
              const angleStep = (2 * Math.PI) / skills.length;
              const angle = angleStep * index - Math.PI / 2;
              const labelRadius = radius + 60;
              const x = center + labelRadius * Math.cos(angle);
              const y = center + labelRadius * Math.sin(angle);

              // Determine text anchor based on position
              let textAnchor = "middle";
              const textX = x;
              const textY = y;

              if (x > center + 15) textAnchor = "start";
              else if (x < center - 15) textAnchor = "end";

              // Performance tier color
              const performanceColor =
                skill.value >= 8
                  ? "#10B981"
                  : skill.value >= 6
                  ? "#3B82F6"
                  : "#F59E0B";

              return (
                <g
                  key={`label-${index}`}
                  className="hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  onMouseEnter={(e) => handleSkillHover(skill, e)}
                  onMouseLeave={handleSkillLeave}
                >
                  {/* Icon background with gradient */}
                  <circle
                    cx={x}
                    cy={y - 10}
                    r="18"
                    fill={`url(#iconGradient-${index})`}
                    stroke={skill.color}
                    strokeWidth="2.5"
                    filter="url(#iconShadow)"
                    className="hover:r-20 transition-all duration-300"
                  />

                  {/* Performance ring */}
                  <circle
                    cx={x}
                    cy={y - 10}
                    r="22"
                    fill="none"
                    stroke={performanceColor}
                    strokeWidth="2"
                    strokeDasharray={`${(skill.value / 10) * 138} 138`}
                    strokeDashoffset="-34.5"
                    opacity="0.4"
                  />

                  {/* Icon */}
                  <foreignObject x={x - 8} y={y - 18} width="16" height="16">
                    <skill.IconComponent
                      size={16}
                      color="white"
                      strokeWidth={2.5}
                    />
                  </foreignObject>

                  {/* Skill name with better styling */}
                  <text
                    x={textX}
                    y={textY + 18}
                    textAnchor={textAnchor}
                    fontSize="12"
                    fill="#E2E8F0"
                    fontWeight="600"
                    className="select-none drop-shadow-sm"
                  >
                    {skill.name}
                  </text>

                  {/* Skill value with enhanced styling */}
                  <text
                    x={textX}
                    y={textY + 34}
                    textAnchor={textAnchor}
                    fontSize="14"
                    fill={skill.color}
                    fontWeight="bold"
                    className="select-none drop-shadow-sm"
                    filter="url(#textGlow)"
                  >
                    {skill.value.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Enhanced gradients, filters, and effects */}
          <defs>
            {/* Main skill area gradient */}
            <radialGradient id="skillGradient" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#1D4ED8" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#1E40AF" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0F172A" stopOpacity="0.05" />
            </radialGradient>

            {/* Stroke gradient for polygon */}
            <linearGradient
              id="skillStroke"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>

            {/* Individual point gradients */}
            {skills.map((skill, index) => (
              <radialGradient
                key={`pointGrad-${index}`}
                id={`pointGradient-${index}`}
                cx="30%"
                cy="30%"
              >
                <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                <stop offset="40%" stopColor={skill.color} />
                <stop offset="100%" stopColor={skill.color} stopOpacity="0.8" />
              </radialGradient>
            ))}

            {/* Icon background gradients */}
            {skills.map((skill, index) => (
              <radialGradient
                key={`iconGrad-${index}`}
                id={`iconGradient-${index}`}
                cx="30%"
                cy="30%"
              >
                <stop offset="0%" stopColor={skill.color} stopOpacity="0.8" />
                <stop offset="60%" stopColor={skill.color} stopOpacity="0.6" />
                <stop offset="100%" stopColor={skill.color} stopOpacity="0.4" />
              </radialGradient>
            ))}

            {/* Glow filter for main polygon */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Shadow filter for points */}
            <filter
              id="pointShadow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3" />
            </filter>

            {/* Shadow filter for icons */}
            <filter
              id="iconShadow"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.4" />
            </filter>

            {/* Text glow effect */}
            <filter id="textGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Tooltip */}
        {hoveredSkill && (
          <div
            className="absolute z-50 pointer-events-none transition-opacity duration-200"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform:
                tooltipPosition.placement === "top"
                  ? "translate(-50%, -100%) translateY(-10px)"
                  : tooltipPosition.placement === "bottom"
                  ? "translate(-50%, 0%) translateY(10px)"
                  : tooltipPosition.placement === "left"
                  ? "translate(-100%, -50%) translateX(-10px)"
                  : tooltipPosition.placement === "right"
                  ? "translate(0%, -50%) translateX(10px)"
                  : "translate(-50%, -50%)", // center fallback
            }}
          >
            <div className="bg-slate-800/95 backdrop-blur-sm border border-slate-600/50 rounded-lg p-4 shadow-xl w-80">
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: hoveredSkill.color + "20",
                    border: `2px solid ${hoveredSkill.color}`,
                  }}
                >
                  <hoveredSkill.IconComponent
                    size={16}
                    color={hoveredSkill.color}
                    strokeWidth={2.5}
                  />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm">
                    {hoveredSkill.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span
                      className="text-lg font-bold"
                      style={{ color: hoveredSkill.color }}
                    >
                      {hoveredSkill.value.toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-sm">/10</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        hoveredSkill.value >= 8
                          ? "bg-emerald-400/20 text-emerald-400"
                          : hoveredSkill.value >= 6
                          ? "bg-blue-400/20 text-blue-400"
                          : "bg-amber-400/20 text-amber-400"
                      }`}
                    >
                      {hoveredSkill.value >= 8
                        ? "Expert"
                        : hoveredSkill.value >= 6
                        ? "Good"
                        : "Needs Work"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-slate-300 font-medium text-xs mb-1">
                    What it measures:
                  </h5>
                  <p className="text-slate-200 text-sm leading-relaxed">
                    {hoveredSkill.description}
                  </p>
                </div>

                <div>
                  <h5 className="text-slate-300 font-medium text-xs mb-1">
                    Example:
                  </h5>
                  <p className="text-slate-400 text-xs leading-relaxed italic">
                    {hoveredSkill.example}
                  </p>
                </div>
              </div>

              {/* Arrow pointer */}
              <div
                className="absolute w-3 h-3 bg-slate-800/95 border-slate-600/50"
                style={{
                  ...(tooltipPosition.placement === "top" && {
                    bottom: "-6px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(45deg)",
                    borderRight: "1px solid #475569",
                    borderBottom: "1px solid #475569",
                  }),
                  ...(tooltipPosition.placement === "bottom" && {
                    top: "-6px",
                    left: "50%",
                    transform: "translateX(-50%) rotate(-135deg)",
                    borderRight: "1px solid #475569",
                    borderBottom: "1px solid #475569",
                  }),
                  ...(tooltipPosition.placement === "left" && {
                    right: "-6px",
                    top: "50%",
                    transform: "translateY(-50%) rotate(135deg)",
                    borderRight: "1px solid #475569",
                    borderBottom: "1px solid #475569",
                  }),
                  ...(tooltipPosition.placement === "right" && {
                    left: "-6px",
                    top: "50%",
                    transform: "translateY(-50%) rotate(-45deg)",
                    borderRight: "1px solid #475569",
                    borderBottom: "1px solid #475569",
                  }),
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced skill breakdown list */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-slate-300 font-medium text-sm">
            Skill Breakdown
          </h5>
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <div className="w-2 h-1 bg-emerald-400 rounded"></div>
            <span>Expert (8-10)</span>
            <div className="w-2 h-1 bg-blue-400 rounded"></div>
            <span>Good (6-8)</span>
            <div className="w-2 h-1 bg-amber-400 rounded"></div>
            <span>Needs Work (&lt;6)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {skills.map((skill, index) => {
            const performanceLevel =
              skill.value >= 8
                ? "expert"
                : skill.value >= 6
                ? "good"
                : "needs-work";

            const widthPercent = (skill.value / 10) * 100;

            return (
              <div
                key={index}
                className="group p-3 rounded-lg bg-slate-700/20 hover:bg-slate-700/40 transition-all duration-300 border border-slate-600/30 hover:border-slate-500/50 cursor-pointer"
                onMouseEnter={(e) => handleSkillHover(skill, e)}
                onMouseLeave={handleSkillLeave}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110"
                      style={{
                        backgroundColor: skill.color + "20",
                        borderColor: skill.color + "60",
                      }}
                    >
                      <skill.IconComponent
                        size={14}
                        color={skill.color}
                        strokeWidth={2.5}
                      />
                    </div>
                    <div>
                      <span className="text-slate-200 font-medium text-sm">
                        {skill.name}
                      </span>
                      <div className="flex items-center space-x-2 mt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            performanceLevel === "expert"
                              ? "bg-emerald-400/20 text-emerald-400"
                              : performanceLevel === "good"
                              ? "bg-blue-400/20 text-blue-400"
                              : "bg-amber-400/20 text-amber-400"
                          }`}
                        >
                          {performanceLevel === "expert"
                            ? "Expert"
                            : performanceLevel === "good"
                            ? "Good"
                            : "Needs Work"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-lg font-bold"
                      style={{ color: skill.color }}
                    >
                      {skill.value.toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-sm">/10</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-600/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${widthPercent}%`,
                      background: `linear-gradient(90deg, ${skill.color}40, ${skill.color})`,
                      boxShadow: `0 0 6px ${skill.color}40`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HookRadarChart;
