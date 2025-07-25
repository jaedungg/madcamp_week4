import { Editor } from '@tiptap/core';
import type { PredictionContext } from './types';

/**
 * 텍스트 예측을 위한 유틸리티 함수들
 */

/**
 * 에디터에서 현재 커서 위치와 문맥 정보를 추출
 */
export function extractPredictionContext(editor: Editor): PredictionContext | null {
  if (!editor) return null;

  try {
    const { from, to } = editor.state.selection;
    const doc = editor.state.doc;
    const fullText = doc.textContent;
    
    // 커서가 선택 영역이 아닌 경우에만 예측
    if (from !== to) return null;

    const cursorPosition = from;
    const textBeforeCursor = fullText.substring(0, cursorPosition);
    const textAfterCursor = fullText.substring(cursorPosition);

    // 현재 단락 추출
    const $pos = doc.resolve(cursorPosition);
    const currentParagraph = $pos.parent.textContent || '';

    // 줄의 끝인지 확인
    const isAtEndOfLine = !textAfterCursor.startsWith(' ') && 
                         (textAfterCursor === '' || textAfterCursor.startsWith('\n'));
    
    // 문서의 끝인지 확인
    const isAtEndOfDocument = cursorPosition === fullText.length;

    return {
      text: fullText,
      cursorPosition,
      textBeforeCursor,
      textAfterCursor,
      currentParagraph,
      isAtEndOfLine,
      isAtEndOfDocument
    };
  } catch (error) {
    console.error('Error extracting prediction context:', error);
    return null;
  }
}

/**
 * 예측을 트리거해야 하는지 판단
 */
export function shouldTriggerPrediction(context: PredictionContext): boolean {
  const { textBeforeCursor, isAtEndOfLine } = context;

  // 최소 길이 체크
  if (textBeforeCursor.trim().length < 5) {
    return false;
  }

  // 너무 긴 텍스트는 제외 (성능 고려)
  if (textBeforeCursor.length > 2000) {
    return false;
  }

  // 특정 문자로 끝나는 경우 예측하지 않음
  const lastChar = textBeforeCursor.slice(-1);
  const nonPredictableChars = ['(', '[', '{', '"', "'", '`'];
  if (nonPredictableChars.includes(lastChar)) {
    return false;
  }

  // 연속된 공백이나 특수 문자가 많은 경우 제외
  if (/\s{3,}$/.test(textBeforeCursor) || /[^\w\s가-힣]{3,}$/.test(textBeforeCursor)) {
    return false;
  }

  return true;
}

/**
 * 예측 결과를 후처리
 */
export function processprediction(prediction: string, context: PredictionContext): string {
  if (!prediction) return '';

  let processed = prediction.trim();

  // 현재 텍스트와 중복되는 부분 제거
  const textBeforeCursor = context.textBeforeCursor.toLowerCase();
  const predictionLower = processed.toLowerCase();
  
  // 시작 부분 중복 제거
  let overlapLength = 0;
  for (let i = 1; i <= Math.min(textBeforeCursor.length, processed.length); i++) {
    const textSuffix = textBeforeCursor.slice(-i);
    const predictionPrefix = predictionLower.slice(0, i);
    if (textSuffix === predictionPrefix) {
      overlapLength = i;
    }
  }
  
  if (overlapLength > 0) {
    processed = processed.substring(overlapLength);
  }

  // 불완전한 문장 처리
  processed = cleanIncompleteText(processed);

  // 빈 결과 처리
  if (!processed.trim()) {
    return '';
  }

  return processed;
}

/**
 * 불완전한 텍스트 정리
 */
function cleanIncompleteText(text: string): string {
  let cleaned = text.trim();

  // 불완전한 따옴표나 괄호 제거
  const openChars = ['(', '[', '{', '"', "'", '`'];
  const closeChars = [')', ']', '}', '"', "'", '`'];
  
  for (let i = 0; i < openChars.length; i++) {
    const open = openChars[i];
    const close = closeChars[i];
    
    // 열린 괄호나 따옴표가 있지만 닫힌 것이 없는 경우
    const openCount = (cleaned.match(new RegExp(`\\${open}`, 'g')) || []).length;
    const closeCount = (cleaned.match(new RegExp(`\\${close}`, 'g')) || []).length;
    
    if (openCount > closeCount) {
      // 마지막 열린 괄호/따옴표부터 끝까지 제거
      const lastOpenIndex = cleaned.lastIndexOf(open);
      if (lastOpenIndex !== -1) {
        cleaned = cleaned.substring(0, lastOpenIndex).trim();
      }
    }
  }

  // 마지막이 불완전한 단어인 경우 (공백으로 끝나지 않는 경우)
  const words = cleaned.split(/\s+/);
  if (words.length > 1 && !cleaned.endsWith(' ')) {
    // 마지막 단어가 불완전할 수 있으므로 확인
    const lastWord = words[words.length - 1];
    const koreanChar = /[가-힣]/;
    const englishChar = /[a-zA-Z]/;
    
    // 한글 또는 영어 단어가 불완전하게 끝난 경우
    if (lastWord.length < 2 || (!koreanChar.test(lastWord) && !englishChar.test(lastWord))) {
      words.pop();
      cleaned = words.join(' ');
    }
  }

  return cleaned;
}

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * 캐시 관리를 위한 클래스
 */
export class PredictionCache {
  private cache = new Map<string, { prediction: string; timestamp: number }>();
  private readonly maxSize = 50;
  private readonly ttl = 5 * 60 * 1000; // 5분

  private generateKey(text: string, cursorPosition: number): string {
    // 텍스트 길이가 긴 경우 해시값 사용 고려
    if (text.length > 200) {
      return `${text.substring(Math.max(0, cursorPosition - 100), cursorPosition + 100)}_${cursorPosition}`;
    }
    return `${text}_${cursorPosition}`;
  }

  get(text: string, cursorPosition: number): string | null {
    const key = this.generateKey(text, cursorPosition);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    // TTL 체크
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.prediction;
  }

  set(text: string, cursorPosition: number, prediction: string): void {
    const key = this.generateKey(text, cursorPosition);
    
    // 캐시 크기 제한
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      prediction,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * 전역 캐시 인스턴스
 */
export const predictionCache = new PredictionCache();