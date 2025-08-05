export interface ModelConfig {
  id: string;
  name: string;
  description?: string;
  apiModel?: string;
  provider: "openai" | "anthropic";
  model: string;
  supported: boolean;
  maxTokens?: number;
}

export interface AnalysisOption {
  id: string;
  name: string;
  description: string;
  category: "content" | "audience" | "psychology" | "engagement";
  enabled: boolean;
}