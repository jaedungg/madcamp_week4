// AI 관련 타입 정의

export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface GenerateRequest {
  prompt: string;
  type?: 'business-email' | 'personal-letter' | 'thank-you' | 'apology-message' | 'casual-message';
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
  length?: 'short' | 'medium' | 'long';
  context?: string;
}

export interface ImproveRequest {
  text: string;
  improvements: string[];
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
}

export interface ToneChangeRequest {
  text: string;
  currentTone: 'formal' | 'casual' | 'friendly' | 'professional';
  targetTone: 'formal' | 'casual' | 'friendly' | 'professional';
}

export interface AIError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PromptTemplate {
  system: string;
  user: string;
  examples?: Array<{
    input: string;
    output: string;
  }>;
}

export interface PredictRequest {
  text: string;
  cursorPosition?: number;
  maxLength?: number;
}

export interface PredictResponse extends AIResponse {
  prediction?: string;
}

export interface PredictionContext {
  text: string;
  cursorPosition: number;
  textBeforeCursor: string;
  textAfterCursor: string;
  currentParagraph: string;
  isAtEndOfLine: boolean;
  isAtEndOfDocument: boolean;
}

export interface TextPredictionState {
  prediction: string;
  isLoading: boolean;
  error: string | null;
  context: PredictionContext | null;
}

export interface UseTextPredictionOptions {
  debounceMs?: number;
  maxLength?: number;
  enabled?: boolean;
  onError?: (error: string) => void;
}

export type AIAction = 
  | 'generate'
  | 'improve'
  | 'tone-change'
  | 'expand'
  | 'summarize'
  | 'translate'
  | 'predict';

export interface AIConfig {
  model: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}