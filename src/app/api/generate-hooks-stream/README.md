# Generate Hooks Stream API Documentation

## Overview

The `/api/generate-hooks-stream` endpoint is the core of the LinkedIn Hook LLM Evaluator. It processes user input through a sophisticated pipeline that generates LinkedIn post hooks using multiple AI models and evaluates them using LLM-as-a-Judge methodology.

## Endpoint Details

- **Method**: `POST`
- **Path**: `/api/generate-hooks-stream`
- **Response Type**: Server-Sent Events (SSE) stream
- **Content-Type**: `text/event-stream`

## Request Body Schema

```typescript
interface RequestBody {
  postIdea: string;                    // The main post concept (required)
  industry?: string;                   // Target industry context (optional)
  targetAudience: 'beginner' | 'intermediate' | 'expert';
  contentType: 'tip' | 'story' | 'announcement' | 'question';
  selectedModels: string[];            // Array of model IDs to use
  focusSkills: string[];              // Skills to emphasize (max 3)
  analysisOptions: string[];          // Types of analysis to perform
}
```

## Processing Pipeline

### Phase 1: Initialization (0-5%)
1. **Request Validation**: Validates all input parameters
2. **Stream Setup**: Initializes Server-Sent Events stream
3. **Pipeline Initialization**: Sets up progress tracking and result storage
4. **LLM Judge Setup**: Initializes GPT-4o judge with backup model

### Phase 2: Model Processing (5-70%)
For each selected AI model:

#### Step 1: Hook Generation (20% of model allocation)
- **Contextual Prompt Creation**: Builds specialized prompt based on:
  - Post idea and content type
  - Industry context (if provided)
  - Target audience level
  - Selected focus skills (Charisma, Empathy, Authority, etc.)
- **Model Invocation**: Calls the specific AI model (GPT-4o, Claude, etc.)
- **Response Parsing**: Extracts exactly 5 hooks from model response
- **Error Handling**: Implements fallback strategies for parsing failures

#### Step 2: LLM Judge Evaluation (80% of model allocation)
For each generated hook:
- **Individual Assessment**: GPT-4o judge evaluates based on 6 criteria:
  - **Attention Grabbing**: Scroll-stopping potential (1-10)
  - **Emotional Impact**: Curiosity, surprise, urgency triggers (1-10)
  - **Clarity & Brevity**: Clear, concise messaging (1-10)
  - **Relevance to Audience**: LinkedIn professional alignment (1-10)
  - **Social Proof**: Authority signals and credibility (1-10)
  - **Actionability Promise**: Implied value proposition (1-10)
- **Confidence Scoring**: Judge provides confidence level (1-10)
- **Qualitative Analysis**: Generates strengths, weaknesses, recommendations
- **Fallback Handling**: Uses basic evaluation if judge fails

#### Step 3: Results Aggregation
- **Score Calculation**: Averages judge scores across all hooks
- **Metadata Collection**: Execution time, token usage, confidence metrics
- **Performance Analysis**: Creates model-specific insights

### Phase 3: Comparative Analysis (70-90%)

#### Cross-Model Evaluation
- **Head-to-Head Comparison**: Compares top hooks from different models
- **Winner Determination**: Uses LLM judge to determine superior hook
- **Reasoning Analysis**: Provides detailed explanation for preference
- **Confidence Assessment**: Evaluates certainty of comparative judgment

#### Analysis Types Processing
Based on `analysisOptions` parameter:
- **Semantic Analysis**: Emotional impact patterns and triggers
- **Psychological Analysis**: Persuasion triggers and authority signals  
- **Engagement Analysis**: Virality and engagement potential calculations

### Phase 4: Final Processing (90-100%)

#### Results Compilation
- **Score Rankings**: Orders models by performance
- **Statistical Analysis**: Calculates score differences and consistency
- **Insight Generation**: Creates actionable recommendations
- **Performance Summary**: Aggregates execution metrics

#### Response Preparation
- **Data Structuring**: Organizes all results into comprehensive response
- **Legacy Compatibility**: Maintains backward compatibility with existing UI
- **Export Preparation**: Formats data for potential saving/export

## Server-Sent Events Stream Format

The API streams progress updates in JSON format:

```typescript
interface StreamEvent {
  type: 'progress' | 'error' | 'complete';
  step: string;                    // Human-readable progress description
  modelId?: string;               // Current model being processed
  progress?: number;              // Percentage complete (0-100)
  data?: Record<string, unknown>; // Final results (only in 'complete' event)
  error?: string;                 // Error message (only in 'error' event)
}
```

### Event Types

#### Progress Events
```json
{
  "type": "progress",
  "step": "Generating hooks with GPT-4o...",
  "modelId": "gpt4o",
  "progress": 25
}
```

#### Error Events
```json
{
  "type": "error",
  "step": "Failed to process claude-3-5-sonnet",
  "modelId": "claude-3-5-sonnet",
  "error": "API rate limit exceeded"
}
```

#### Completion Event
```json
{
  "type": "complete",
  "step": "Analysis complete! Results ready.",
  "progress": 100,
  "data": {
    "results": { /* Model results */ },
    "comparison": { /* Comparative analysis */ },
    "analytics": { /* Performance metrics */ },
    "insights": { /* Generated insights */ }
  }
}
```

## Response Structure

### Final Results Object
```typescript
interface FinalResults {
  results: Record<string, ModelResult>;  // Results keyed by model ID
  comparison: ComparisonResult;          // Cross-model analysis
  analytics: AnalyticsData;             // Performance metrics
  insights: InsightsData;               // Generated insights
}
```

### Model Result Structure
```typescript
interface ModelResult {
  model: string;                    // Human-readable model name
  provider: string;                 // 'openai' | 'anthropic'
  hooks: HookEvaluation[];         // Array of evaluated hooks
  averageScore: number;            // Overall average score
  basicAverageScore: number;       // Basic evaluation average
  strengthsAndWeaknesses: {
    strengths: string[];
    weaknesses: string[];
  };
  executionTime: number;           // Processing time in ms
  tokensUsed?: number;            // Token consumption
  judgeMetadata: {
    evaluationMethod: string;
    judgeModel: string;
    backupModel: string;
    avgConfidence: number;
  };
}
```

### Hook Evaluation Structure
```typescript
interface HookEvaluation {
  hook: string;                    // The generated hook text
  wordCount: number;              // Word count analysis
  totalScore: number;             // Primary judge score (0-10)
  basicScore: number;             // Fallback basic score
  explanation: string;            // Basic evaluation explanation
  judgeAnalysis: {
    criteriaBreakdown: CriteriaResult[];
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    confidence: number;
  };
  // Legacy compatibility fields
  semanticScore: number;
  engagementPrediction: number;
  confidenceLevel: number;
  recommendations: string[];
}
```

## Error Handling Strategy

### Model-Level Errors
- Individual model failures don't stop the entire process
- Failed models return empty results with error metadata
- Other models continue processing normally

### Judge Evaluation Errors
- Falls back to basic evaluation algorithm
- Maintains processing flow with reduced confidence
- Logs errors for debugging while preserving user experience

### Stream Errors
- Critical errors terminate the stream with error event
- Partial results are preserved when possible
- Client receives detailed error information

## Performance Characteristics

### Typical Processing Times
- **Single Model**: 15-30 seconds
- **Two Models**: 25-45 seconds  
- **Multiple Models**: 35-60 seconds

### Token Usage (Approximate)
- **Hook Generation**: 500-1000 tokens per model
- **Judge Evaluation**: 200-400 tokens per hook
- **Comparative Analysis**: 300-600 tokens per comparison

### Progress Distribution
- **Model Processing**: 70% of total time
- **Judge Evaluation**: 15% of total time
- **Comparative Analysis**: 10% of total time
- **Final Processing**: 5% of total time

## Implementation Notes

### Concurrency Handling
- Models are processed sequentially for better progress tracking
- Judge evaluations within a model are processed sequentially
- Global state is managed carefully to prevent race conditions

### Memory Management
- Results are stored in process memory during execution
- Temporary data is cleaned up after completion
- Large responses are streamed to prevent memory issues

### Rate Limiting Considerations
- Individual API calls respect provider rate limits
- Sequential processing reduces concurrent API load
- Error handling includes retry logic for rate limit errors