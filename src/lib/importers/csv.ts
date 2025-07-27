// CSV 파일 파서

import { parse } from 'csv-parse';
import type { FileParseResult, ParsedDocument } from '../types/import';

/**
 * CSV 파일 파싱
 * 지원하는 열 이름 (대소문자 무시):
 * - title, name, subject (제목)
 * - content, body, text, description (내용)  
 * - category, type, group (카테고리)
 * - tags, keywords (태그, 쉼표 구분)
 */
export async function parseCsvFile(file: File): Promise<FileParseResult> {
  const result: FileParseResult = {
    success: false,
    documents: [],
    errors: []
  };

  try {
    const text = await file.text();
    
    if (!text.trim()) {
      result.errors.push('파일이 비어있습니다.');
      return result;
    }

    // CSV 파싱
    const records = await new Promise<string[][]>((resolve, reject) => {
      parse(text, {
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        encoding: 'utf8'
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records as string[][]);
      });
    });

    if (records.length === 0) {
      result.errors.push('CSV 파일에 데이터가 없습니다.');
      return result;
    }

    if (records.length === 1) {
      result.errors.push('헤더만 있고 데이터가 없습니다.');
      return result;
    }

    // 헤더 분석
    const headers = records[0].map(h => h.toLowerCase().trim());
    const columnMapping = analyzeCsvHeaders(headers);

    if (!columnMapping.title) {
      result.errors.push('제목 열을 찾을 수 없습니다. (title, name, subject 중 하나 필요)');
      return result;
    }

    if (!columnMapping.content) {
      result.errors.push('내용 열을 찾을 수 없습니다. (content, body, text, description 중 하나 필요)');
      return result;
    }

    // 데이터 행 처리
    for (let i = 1; i < records.length; i++) {
      const row = records[i];
      
      try {
        const doc = parseCsvRow(row, columnMapping, i);
        if (doc) {
          result.documents.push(doc);
        }
      } catch (error) {
        result.errors.push(`행 ${i + 1}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }

    result.success = result.documents.length > 0;
    
    if (result.documents.length === 0 && result.errors.length === 0) {
      result.errors.push('처리할 수 있는 데이터가 없습니다.');
    }

  } catch (error) {
    result.errors.push(`CSV 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }

  return result;
}

/**
 * CSV 헤더 분석하여 열 매핑 생성
 */
function analyzeCsvHeaders(headers: string[]): {
  title?: number;
  content?: number;
  category?: number;
  tags?: number;
} {
  const mapping: {
    title?: number;
    content?: number;
    category?: number;
    tags?: number;
  } = {};

  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // 제목 열
    if (!mapping.title) {
      if (['title', 'name', 'subject', '제목', '이름', '주제'].includes(header)) {
        mapping.title = i;
      }
    }

    // 내용 열
    if (!mapping.content) {
      if (['content', 'body', 'text', 'description', '내용', '본문', '텍스트', '설명'].includes(header)) {
        mapping.content = i;
      }
    }

    // 카테고리 열
    if (!mapping.category) {
      if (['category', 'type', 'group', 'class', '카테고리', '유형', '그룹', '분류'].includes(header)) {
        mapping.category = i;
      }
    }

    // 태그 열
    if (!mapping.tags) {
      if (['tags', 'keywords', 'labels', '태그', '키워드', '라벨'].includes(header)) {
        mapping.tags = i;
      }
    }
  }

  return mapping;
}

/**
 * CSV 행 파싱
 */
function parseCsvRow(
  row: string[], 
  mapping: {
    title?: number;
    content?: number;
    category?: number;
    tags?: number;
  }, 
  rowIndex: number
): ParsedDocument | null {
  // 빈 행 건너뛰기
  if (row.every(cell => !cell || !cell.trim())) {
    return null;
  }

  // 제목 추출
  const title = mapping.title !== undefined ? row[mapping.title]?.trim() : '';
  if (!title) {
    throw new Error('제목이 비어있습니다.');
  }

  // 내용 추출
  const content = mapping.content !== undefined ? row[mapping.content]?.trim() : '';
  if (!content) {
    throw new Error('내용이 비어있습니다.');
  }

  // 카테고리 추출
  const category = mapping.category !== undefined ? row[mapping.category]?.trim() : undefined;

  // 태그 추출
  let tags: string[] | undefined;
  if (mapping.tags !== undefined && row[mapping.tags]) {
    const tagString = row[mapping.tags].trim();
    if (tagString) {
      tags = tagString
        .split(/[,;|]/) // 쉼표, 세미콜론, 파이프로 구분
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      if (tags.length === 0) {
        tags = undefined;
      }
    }
  }

  return {
    title,
    content,
    category: category || undefined,
    tags,
    metadata: {
      originalIndex: rowIndex - 1, // 헤더 제외
      source: 'csv',
      row: rowIndex + 1
    }
  };
}

/**
 * CSV 파일 인코딩 감지 및 변환
 */
export async function detectCsvEncoding(file: File): Promise<string> {
  // 첫 1KB만 읽어서 인코딩 감지
  const chunk = file.slice(0, 1024);
  const arrayBuffer = await chunk.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  // UTF-8 BOM 확인
  if (uint8Array.length >= 3 && 
      uint8Array[0] === 0xEF && 
      uint8Array[1] === 0xBB && 
      uint8Array[2] === 0xBF) {
    return 'utf-8';
  }

  // UTF-16 BOM 확인
  if (uint8Array.length >= 2) {
    if (uint8Array[0] === 0xFF && uint8Array[1] === 0xFE) {
      return 'utf-16le';
    }
    if (uint8Array[0] === 0xFE && uint8Array[1] === 0xFF) {
      return 'utf-16be';
    }
  }

  // 한글 포함 여부로 EUC-KR 추정
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  const koreanRegex = /[가-힣]/;
  
  if (koreanRegex.test(text)) {
    // 한글이 포함된 경우 UTF-8로 시도
    return 'utf-8';
  }

  return 'utf-8'; // 기본값
}