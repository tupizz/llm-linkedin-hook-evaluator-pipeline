import { AnalysisOption } from "@/types";
import { useState } from "react";

export interface HookGenerationState {
  postIdea: string;
  industry: string;
  targetAudience: string;
  contentType: string;
  selectedModels: string[];
  focusSkills: string[];
  analysisOptions: AnalysisOption[];
  isLoading: boolean;
  results: any;
  currentStep: string;
  progress: number;
}

export interface HookGenerationActions {
  setPostIdea: (value: string) => void;
  setIndustry: (value: string) => void;
  setTargetAudience: (value: string) => void;
  setContentType: (value: string) => void;
  setSelectedModels: (models: string[]) => void;
  setFocusSkills: (skills: string[]) => void;
  handleGenerate: () => Promise<void>;
  saveAnalysis: () => Promise<void>;
}

const DEFAULT_ANALYSIS_OPTIONS: AnalysisOption[] = [
  {
    id: "semantic",
    name: "Emotional Impact",
    description: "Analyze curiosity, surprise, and emotional triggers",
    category: "psychology",
    enabled: true,
  },
  {
    id: "psychological",
    name: "Persuasion Triggers",
    description: "Detect authority, scarcity, social proof patterns",
    category: "psychology",
    enabled: true,
  },
  {
    id: "engagement",
    name: "Virality Prediction",
    description: "Predict likes, comments, shares potential",
    category: "engagement",
    enabled: true,
  },
];

export function useHookGeneration(): HookGenerationState &
  HookGenerationActions {
  const [postIdea, setPostIdea] = useState(
    "Create a post about personal branding with ai in 2025 for b2b companies"
  );
  const [industry, setIndustry] = useState("B2B");
  const [targetAudience, setTargetAudience] = useState("intermediate");
  const [contentType, setContentType] = useState("tip");
  const [selectedModels, setSelectedModels] = useState<string[]>([
    "gpt-5",
    "gpt4o",
    "gpt-4.1",
  ]);
  const [focusSkills, setFocusSkills] = useState<string[]>([
    "attention_grabbing",
  ]);
  const [analysisOptions] = useState<AnalysisOption[]>(
    DEFAULT_ANALYSIS_OPTIONS
  );
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState("");
  const [progress, setProgress] = useState(0);

  const getEnabledAnalysisTypes = () => {
    return analysisOptions
      .filter((option) => option.enabled)
      .map((option) => option.id);
  };

  const saveAnalysis = async () => {
    if (!results) return;

    try {
      const exportData = {
        postIdea,
        industry,
        targetAudience,
        contentType,
        selectedModels,
        focusSkills,
        analysisOptions: getEnabledAnalysisTypes(),
        results: results.results,
        comparison: results.comparison,
        analytics: results.analytics,
        insights: results.insights,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch("/api/save-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(
          errorResult.error || "Failed to generate analysis export"
        );
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch
        ? filenameMatch[1]
        : `linkedin-hook-analysis-${Date.now()}.json`;

      // Get the JSON data as blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.style.display = "none";

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Success notification
      alert(
        `Analysis exported successfully!\nFile: ${filename}\nSize: ${Math.round(
          blob.size / 1024
        )}KB`
      );
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        `Failed to export analysis: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleGenerate = async () => {
    if (!postIdea.trim()) return;

    setIsLoading(true);
    setResults(null);
    setProgress(0);
    setCurrentStep("Initializing...");

    try {
      const response = await fetch("/api/generate-hooks-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postIdea,
          industry,
          targetAudience,
          contentType,
          selectedModels,
          focusSkills,
          analysisOptions: getEnabledAnalysisTypes(),
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));

              if (event.type === "progress") {
                setCurrentStep(event.step);
                setProgress(event.progress || 0);
              } else if (event.type === "complete") {
                // Fetch results from the blob URL
                if (event.data?.url) {
                  try {
                    const resultsResponse = await fetch(event.data.url);
                    const resultsData = await resultsResponse.json();
                    setResults(resultsData);
                  } catch (fetchError) {
                    console.error(
                      "Failed to fetch results from blob:",
                      fetchError
                    );
                    setCurrentStep("Failed to load results. Please try again.");
                  }
                } else {
                  setResults(event.data);
                }
                setIsLoading(false);
              } else if (event.type === "error") {
                throw new Error(event.error);
              }
            } catch (parseError) {
              console.warn("Failed to parse SSE event:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setCurrentStep("Generation failed. Please try again.");
      setIsLoading(false);
    }
  };

  return {
    // State
    postIdea,
    industry,
    targetAudience,
    contentType,
    selectedModels,
    focusSkills,
    analysisOptions,
    isLoading,
    results,
    currentStep,
    progress,

    // Actions
    setPostIdea,
    setIndustry,
    setTargetAudience,
    setContentType,
    setSelectedModels,
    setFocusSkills,
    handleGenerate,
    saveAnalysis,
  };
}
