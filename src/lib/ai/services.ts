import type {
  GenerateRequest,
  ImproveRequest,
  ToneChangeRequest,
  AIResponse,
  PredictRequest
} from './types';
import { Editor } from '@tiptap/core';

// 기본 톤 설정을 가져오는 함수
function getDefaultTone(): 'formal' | 'professional' | 'friendly' | 'casual' {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('from-settings-storage');
      if (stored) {
        const settings = JSON.parse(stored);
        return settings.state?.defaultTone || 'professional';
      }
    } catch {
      // localStorage 접근 실패 시 기본값 반환
    }
  }
  return 'professional';
}

// SummarizeRequest 타입 추가
export interface SummarizeRequest {
  text: string;
  length?: 'short' | 'medium' | 'long';
  tone?: 'formal' | 'casual' | 'friendly' | 'professional';
}

// ExpandRequest 타입 추가
export interface ExpandRequest {
  text: string;
  expansionType?: 'detail' | 'context' | 'emotion' | 'example';
  length?: 'medium' | 'long' | 'very-long';
  tone?: 'formal' | 'professional' | 'friendly' | 'casual';
}

/**
 * AI 텍스트 생성 서비스
 */
export async function generateText(request: GenerateRequest): Promise<AIResponse> {
  try {
    // 톤이 지정되지 않았으면 기본 톤 사용
    const requestWithTone = {
      ...request,
      tone: request.tone || getDefaultTone()
    };

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithTone),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '텍스트 생성에 실패했습니다.'
      };
    }

    return data;
  } catch (error) {
    console.error('Generate API 요청 오류:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * AI 텍스트 개선 서비스
 */
export async function improveText(request: ImproveRequest): Promise<AIResponse> {
  try {
    // 톤이 지정되지 않았으면 기본 톤 사용
    const requestWithTone = {
      ...request,
      tone: request.tone || getDefaultTone()
    };

    const response = await fetch('/api/ai/improve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithTone),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '텍스트 개선에 실패했습니다.'
      };
    }

    return data;
  } catch (error) {
    console.error('Improve API 요청 오류:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * AI 톤 변경 서비스
 */
export async function changeTone(request: ToneChangeRequest): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/tone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '톤 변경에 실패했습니다.'
      };
    }

    return data;
  } catch (error) {
    console.error('Tone Change API 요청 오류:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * AI 텍스트 요약 서비스
 */
export async function summarizeText(request: SummarizeRequest): Promise<AIResponse> {
  try {
    // 톤이 지정되지 않았으면 기본 톤 사용
    const requestWithTone = {
      ...request,
      tone: request.tone || getDefaultTone()
    };

    const response = await fetch('/api/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithTone),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '텍스트 요약에 실패했습니다.'
      };
    }

    return data;
  } catch (error) {
    console.error('Summarize API 요청 오류:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * AI 텍스트 확장 서비스
 */
export async function expandText(request: ExpandRequest): Promise<AIResponse> {
  try {
    // 톤이 지정되지 않았으면 기본 톤 사용
    const requestWithTone = {
      ...request,
      tone: request.tone || getDefaultTone()
    };

    const response = await fetch('/api/ai/expand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestWithTone),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '텍스트 확장에 실패했습니다.'
      };
    }

    return data;
  } catch (error) {
    console.error('Expand API 요청 오류:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * AI 텍스트 예측 서비스
 */
export async function predictText(request: PredictRequest): Promise<AIResponse> {
  try {
    const response = await fetch('/api/ai/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || '텍스트 예측에 실패했습니다.'
      };
    }

    return data;
  } catch (error) {
    console.error('Predict API 요청 오류:', error);
    return {
      success: false,
      error: '네트워크 오류가 발생했습니다.'
    };
  }
}

/**
 * 텍스트에서 선택된 부분 추출
 */
export function getSelectedText(editor: Editor): string {
  if (!editor) return '';

  const { from, to } = editor.state.selection;
  if (from === to) {
    // 선택된 텍스트가 없으면 전체 텍스트 반환
    return editor.getText();
  }

  // 선택된 텍스트 반환
  return editor.state.doc.textBetween(from, to, ' ');
}

/**
 * 에디터에 텍스트 삽입/교체
 */
export function insertOrReplaceText(editor: Editor, newText: string, replaceSelection: boolean = false): void {
  if (!editor || !newText) return;

  if (replaceSelection) {
    // 선택된 텍스트 교체
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(newText).run();
  } else {
    // 현재 위치에 삽입
    editor.chain().focus().insertContent(newText).run();
  }
}

/**
 * 에디터에서 현재 커서 위치의 단락 텍스트 가져오기
 */
export function getCurrentParagraphText(editor: Editor): string {
  if (!editor) return '';

  const { $from } = editor.state.selection;
  const currentNode = $from.node($from.depth);

  if (currentNode && currentNode.textContent) {
    return currentNode.textContent;
  }

  return '';
}

/**
 * 토큰 사용량을 기반으로 예상 비용 계산
 */
export function calculateCost(usage?: { totalTokens: number }): number {
  if (!usage || !usage.totalTokens) return 0;

  // GPT-4o-mini 가격 (2024년 기준): $0.15/1M input tokens, $0.6/1M output tokens
  // 간단화를 위해 평균 가격 사용: $0.375/1M tokens
  const pricePerMillionTokens = 0.375;
  return (usage.totalTokens / 1000000) * pricePerMillionTokens;
}

/**
 * AI 응답 처리 및 메타데이터 추출
 */
export function processAIResponse(response: AIResponse): {
  content: string;
  cost: number;
  metadata: unknown;
} {
  return {
    content: response.content || '',
    cost: calculateCost(response.usage),
    metadata: response.usage
  };
}