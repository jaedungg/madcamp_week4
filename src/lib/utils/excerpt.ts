/**
 * HTML을 플레인 텍스트로 변환하고 excerpt를 생성하는 유틸리티 함수들
 */

/**
 * HTML 문자열을 플레인 텍스트로 변환
 * @param html HTML 문자열
 * @returns 정리된 플레인 텍스트
 */
export function htmlToPlainText(html: string): string {
  if (!html || html.trim() === '') {
    return '';
  }

  // HTML 태그 제거
  const text = html
    // 줄바꿈을 공백으로 변환 (단락 구분 유지를 위해)
    .replace(/<\/p>/gi, '</p> ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/div>/gi, '</div> ')
    .replace(/<\/h[1-6]>/gi, '</h> ')
    .replace(/<\/li>/gi, '</li> ')
    // 모든 HTML 태그 제거
    .replace(/<[^>]*>/g, '')
    // HTML 엔티티 디코딩
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    // 연속된 공백을 하나로 정리
    .replace(/\s+/g, ' ')
    // 앞뒤 공백 제거
    .trim();

  return text;
}

/**
 * 텍스트에서 excerpt를 생성
 * @param text 플레인 텍스트
 * @param maxLength 최대 길이 (기본값: 100)
 * @returns excerpt 문자열
 */
export function generateExcerpt(text: string, maxLength: number = 100): string {
  if (!text || text.trim() === '') {
    return '';
  }

  const cleanText = text.trim();
  
  if (cleanText.length <= maxLength) {
    return cleanText;
  }

  // 문장 단위로 자르기 시도
  const sentences = cleanText.split(/[.!?。！？]/);
  let excerpt = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;
    
    const potentialExcerpt = excerpt + (excerpt ? '. ' : '') + trimmedSentence;
    
    if (potentialExcerpt.length <= maxLength) {
      excerpt = potentialExcerpt;
    } else {
      break;
    }
  }

  // 문장 단위로 자르기가 불가능한 경우 글자 수로 자르기
  if (!excerpt || excerpt.length < maxLength * 0.7) {
    excerpt = cleanText.substring(0, maxLength - 3);
    
    // 한글 단어 경계에서 자르기
    const lastSpaceIndex = excerpt.lastIndexOf(' ');
    if (lastSpaceIndex > maxLength * 0.5) {
      excerpt = excerpt.substring(0, lastSpaceIndex);
    }
  }

  return excerpt + (excerpt.length < cleanText.length ? '...' : '');
}

/**
 * HTML에서 직접 excerpt를 생성하는 편의 함수
 * @param html HTML 문자열
 * @param maxLength 최대 길이 (기본값: 100)
 * @returns excerpt 문자열
 */
export function createExcerptFromHtml(html: string, maxLength: number = 100): string {
  const plainText = htmlToPlainText(html);
  return generateExcerpt(plainText, maxLength);
}

/**
 * 텍스트의 단어 수를 계산 (한국어와 영어 모두 고려)
 * @param text 플레인 텍스트
 * @returns 단어 수
 */
export function countWords(text: string): number {
  if (!text || text.trim() === '') {
    return 0;
  }

  const cleanText = text.trim();
  
  // 한글과 영어 단어를 분리해서 계산
  const englishWords = cleanText.match(/[a-zA-Z]+/g) || [];
  const numbers = cleanText.match(/\d+/g) || [];
  
  // 한글은 어절(공백으로 구분된 단위) 기준으로 계산
  const koreanWordCount = cleanText
    .replace(/[^가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.trim().length > 0).length;
  
  // 영어와 숫자는 개별 단어로 계산
  const englishWordCount = englishWords.length;
  const numberCount = numbers.length;
  
  return Math.max(koreanWordCount, englishWordCount + numberCount);
}

/**
 * HTML에서 직접 단어 수를 계산하는 편의 함수
 * @param html HTML 문자열
 * @returns 단어 수
 */
export function countWordsFromHtml(html: string): number {
  const plainText = htmlToPlainText(html);
  return countWords(plainText);
}