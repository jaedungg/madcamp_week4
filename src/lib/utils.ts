import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * HTML 콘텐츠를 일반 텍스트로 변환합니다.
 * @param html - 변환할 HTML 문자열
 * @returns 일반 텍스트 문자열
 */
export function htmlToPlainText(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  try {
    // DOMParser를 사용하여 HTML을 파싱
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // 텍스트 콘텐츠 추출
    let text = doc.body.textContent || doc.body.innerText || '';
    
    // 여러 개의 연속된 공백을 하나로 줄이기
    text = text.replace(/\s+/g, ' ');
    
    // 앞뒤 공백 제거
    text = text.trim();
    
    return text;
  } catch (error) {
    console.error('HTML을 텍스트로 변환하는 중 오류 발생:', error);
    // 오류 발생 시 간단한 정규식으로 HTML 태그 제거
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}