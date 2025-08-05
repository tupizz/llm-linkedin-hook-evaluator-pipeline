export interface EvaluationCriteria {
  englishLanguage: number; // 0-10
  length: number; // 0-10 (6-12 words is optimal)
  emotion: number; // 0-10
  linkedinRelevance: number; // 0-10
  readability: number; // 0-10
  attentionGrabbing: number; // 0-10
  bonusPoints: number; // 0-5 (for numbers, data, personal experience)
}

export interface HookEvaluation {
  hook: string;
  wordCount: number;
  criteria: EvaluationCriteria;
  totalScore: number;
  explanation: string;
}

export interface ModelComparison {
  gpt4o: {
    hooks: HookEvaluation[];
    averageScore: number;
  };
  gpt41: {
    hooks: HookEvaluation[];
    averageScore: number;
  };
  winner: 'gpt4o' | 'gpt41' | 'tie';
  scoreDifference: number;
}

// Keywords that indicate emotion
const EMOTION_KEYWORDS = [
  'secret', 'shocking', 'amazing', 'incredible', 'mistake', 'failed', 'learned',
  'discovered', 'revealed', 'surprised', 'unexpected', 'breakthrough', 'transformed',
  'doubled', 'tripled', 'skyrocketed', 'crashed', 'bombed', 'nailed', 'crushed'
];

// Keywords that indicate B2B/LinkedIn relevance
const LINKEDIN_KEYWORDS = [
  'business', 'startup', 'entrepreneur', 'career', 'leadership', 'team', 'sales',
  'marketing', 'growth', 'revenue', 'client', 'customer', 'brand', 'strategy',
  'innovation', 'technology', 'ai', 'data', 'analytics', 'roi', 'kpi', 'b2b',
  'saas', 'ceo', 'manager', 'professional', 'networking', 'industry'
];

// Keywords that are jargon or complex
const JARGON_KEYWORDS = [
  'synergy', 'paradigm', 'leverage', 'ideate', 'operationalize', 'monetize',
  'optimize', 'streamline', 'ecosystem', 'disruptive', 'scalable', 'robust',
  'enterprise-grade', 'end-to-end', 'holistic', 'omnichannel'
];

// Number patterns for bonus points
const NUMBER_PATTERNS = [
  /\d+%/, // percentages
  /\$\d+/, // dollar amounts
  /\d+x/, // multipliers
  /\d+k/, // thousands
  /\d+m/, // millions
  /\d+ to \d+/, // ranges
  /\d+\+/, // plus signs
];

function evaluateEnglishLanguage(hook: string): number {
  // Check for basic English grammar and structure
  const words = hook.split(' ');
  const hasProperCapitalization = hook[0] === hook[0].toUpperCase();
  const hasReasonableLength = words.length >= 3;
  const noSpecialChars = !/[^\w\s.,!?$%+-]/.test(hook);
  
  let score = 6; // base score
  if (hasProperCapitalization) score += 1;
  if (hasReasonableLength) score += 2;
  if (noSpecialChars) score += 1;
  
  return Math.min(score, 10);
}

function evaluateLength(hook: string): number {
  const wordCount = hook.split(' ').length;
  
  if (wordCount >= 6 && wordCount <= 12) {
    return 10; // Perfect length
  } else if (wordCount >= 4 && wordCount <= 15) {
    return 7; // Good length
  } else if (wordCount >= 3 && wordCount <= 18) {
    return 5; // Acceptable length
  } else {
    return 2; // Poor length
  }
}

function evaluateEmotion(hook: string): number {
  const lowerHook = hook.toLowerCase();
  let score = 3; // base score
  
  // Check for emotional keywords
  const emotionMatches = EMOTION_KEYWORDS.filter(keyword => 
    lowerHook.includes(keyword)
  ).length;
  
  score += Math.min(emotionMatches * 2, 4);
  
  // Check for question marks (curiosity)
  if (hook.includes('?')) score += 1;
  
  // Check for exclamation marks (excitement)
  if (hook.includes('!')) score += 1;
  
  // Check for numbers (often emotional)
  if (/\d/.test(hook)) score += 1;
  
  return Math.min(score, 10);
}

function evaluateLinkedInRelevance(hook: string): number {
  const lowerHook = hook.toLowerCase();
  let score = 4; // base score
  
  // Check for LinkedIn-relevant keywords
  const relevanceMatches = LINKEDIN_KEYWORDS.filter(keyword => 
    lowerHook.includes(keyword)
  ).length;
  
  score += Math.min(relevanceMatches * 2, 6);
  
  return Math.min(score, 10);
}

function evaluateReadability(hook: string): number {
  const lowerHook = hook.toLowerCase();
  let score = 8; // start high, subtract for complexity
  
  // Subtract for jargon
  const jargonMatches = JARGON_KEYWORDS.filter(keyword => 
    lowerHook.includes(keyword)
  ).length;
  
  score -= jargonMatches * 2;
  
  // Subtract for very long words (>10 characters)
  const longWords = hook.split(' ').filter(word => word.length > 10).length;
  score -= longWords;
  
  // Subtract for complex punctuation
  const complexPunctuation = (hook.match(/[;:]/g) || []).length;
  score -= complexPunctuation;
  
  return Math.max(score, 1);
}

function evaluateAttentionGrabbing(hook: string): number {
  let score = 4; // base score
  
  // Strong opening words
  const strongOpeners = ['why', 'how', 'what', 'when', 'i', 'my', 'this', 'here'];
  const firstWord = hook.split(' ')[0].toLowerCase();
  if (strongOpeners.includes(firstWord)) score += 2;
  
  // Numbers grab attention
  if (/\d/.test(hook)) score += 2;
  
  // Contrasts and comparisons
  if (hook.toLowerCase().includes('vs') || 
      hook.toLowerCase().includes('before') ||
      hook.toLowerCase().includes('after')) score += 1;
  
  // Personal pronouns create connection
  if (/\b(i|my|me|we|us|our)\b/i.test(hook)) score += 1;
  
  return Math.min(score, 10);
}

function evaluateBonusPoints(hook: string): number {
  let score = 0;
  
  // Check for numbers/results
  const hasNumbers = NUMBER_PATTERNS.some(pattern => pattern.test(hook));
  if (hasNumbers) score += 2;
  
  // Check for personal experience indicators
  const personalIndicators = ['i', 'my', 'me', 'learned', 'discovered', 'found'];
  const hasPersonal = personalIndicators.some(indicator => 
    hook.toLowerCase().includes(indicator)
  );
  if (hasPersonal) score += 2;
  
  // Check for specific results
  if (hook.toLowerCase().includes('grew') || 
      hook.toLowerCase().includes('increased') ||
      hook.toLowerCase().includes('reduced')) score += 1;
  
  return Math.min(score, 5);
}

export function evaluateHook(hook: string): HookEvaluation {
  const wordCount = hook.split(' ').length;
  
  const criteria: EvaluationCriteria = {
    englishLanguage: evaluateEnglishLanguage(hook),
    length: evaluateLength(hook),
    emotion: evaluateEmotion(hook),
    linkedinRelevance: evaluateLinkedInRelevance(hook),
    readability: evaluateReadability(hook),
    attentionGrabbing: evaluateAttentionGrabbing(hook),
    bonusPoints: evaluateBonusPoints(hook),
  };
  
  // Calculate total score (base criteria out of 60, bonus out of 5)
  const baseScore = Object.entries(criteria)
    .filter(([key]) => key !== 'bonusPoints')
    .reduce((sum, [, value]) => sum + value, 0);
  
  const totalScore = Math.round((baseScore + criteria.bonusPoints) / 65 * 100) / 10;
  
  // Generate explanation
  const strengths = [];
  const weaknesses = [];
  
  if (criteria.length >= 8) strengths.push('optimal length');
  else if (criteria.length < 5) weaknesses.push('poor length');
  
  if (criteria.emotion >= 7) strengths.push('strong emotional appeal');
  else if (criteria.emotion < 4) weaknesses.push('lacks emotion');
  
  if (criteria.linkedinRelevance >= 7) strengths.push('highly relevant for LinkedIn');
  else if (criteria.linkedinRelevance < 4) weaknesses.push('low LinkedIn relevance');
  
  if (criteria.bonusPoints >= 2) strengths.push('includes specific results/data');
  
  let explanation = '';
  if (strengths.length > 0) {
    explanation += `Strengths: ${strengths.join(', ')}.`;
  }
  if (weaknesses.length > 0) {
    explanation += ` Areas for improvement: ${weaknesses.join(', ')}.`;
  }
  if (!explanation) {
    explanation = 'Average performance across all criteria.';
  }
  
  return {
    hook,
    wordCount,
    criteria,
    totalScore,
    explanation: explanation.trim(),
  };
}

export function compareModels(
  gpt4oHooks: string[],
  gpt41Hooks: string[]
): ModelComparison {
  const gpt4oEvaluations = gpt4oHooks.map(evaluateHook);
  const gpt41Evaluations = gpt41Hooks.map(evaluateHook);
  
  const gpt4oAverage = gpt4oEvaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / gpt4oEvaluations.length;
  const gpt41Average = gpt41Evaluations.reduce((sum, evaluation) => sum + evaluation.totalScore, 0) / gpt41Evaluations.length;
  
  const scoreDifference = Math.abs(gpt4oAverage - gpt41Average);
  
  let winner: 'gpt4o' | 'gpt41' | 'tie';
  if (scoreDifference < 0.1) {
    winner = 'tie';
  } else if (gpt4oAverage > gpt41Average) {
    winner = 'gpt4o';
  } else {
    winner = 'gpt41';
  }
  
  return {
    gpt4o: {
      hooks: gpt4oEvaluations,
      averageScore: Math.round(gpt4oAverage * 10) / 10,
    },
    gpt41: {
      hooks: gpt41Evaluations,
      averageScore: Math.round(gpt41Average * 10) / 10,
    },
    winner,
    scoreDifference: Math.round(scoreDifference * 10) / 10,
  };
}