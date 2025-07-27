// JSON 파일 파서

import type { FileParseResult, ParsedDocument } from '../types/import';

/**
 * JSON 파일 파싱
 * 지원하는 형식:
 * 1. 단일 문서: { title, content, category?, tags? }
 * 2. 문서 배열: [{ title, content, category?, tags? }, ...]
 * 3. 내보내기 형식: { documents: [...] } 또는 { data: [...] }
 */
export async function parseJsonFile(file: File): Promise<FileParseResult> {
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

    let jsonData;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      result.errors.push('올바른 JSON 형식이 아닙니다.');
      return result;
    }

    const documents = extractDocumentsFromJson(jsonData);
    
    if (documents.length === 0) {
      result.errors.push('유효한 문서가 없습니다.');
      return result;
    }

    // 각 문서 검증 및 정규화
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      try {
        const normalizedDoc = normalizeJsonDocument(doc, i);
        if (normalizedDoc) {
          result.documents.push(normalizedDoc);
        }
      } catch (error) {
        result.errors.push(`문서 ${i + 1}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }

    result.success = result.documents.length > 0;
    
    if (result.documents.length === 0 && result.errors.length === 0) {
      result.errors.push('처리할 수 있는 문서가 없습니다.');
    }

  } catch (error) {
    result.errors.push(`파일 읽기 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }

  return result;
}

/**
 * JSON 데이터에서 문서 배열 추출
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDocumentsFromJson(jsonData: any): any[] {
  // 배열인 경우
  if (Array.isArray(jsonData)) {
    return jsonData;
  }

  // 객체인 경우
  if (typeof jsonData === 'object' && jsonData !== null) {
    // 내보내기 형식: { documents: [...] }
    if (Array.isArray(jsonData.documents)) {
      return jsonData.documents;
    }
    
    // 다른 형식: { data: [...] }
    if (Array.isArray(jsonData.data)) {
      return jsonData.data;
    }

    // 단일 문서
    if (jsonData.title || jsonData.content) {
      return [jsonData];
    }

    // 객체의 값들 중에서 배열 찾기
    const values = Object.values(jsonData);
    for (const value of values) {
      if (Array.isArray(value) && value.length > 0) {
        // 첫 번째 요소가 문서 형태인지 확인
        const firstItem = value[0];
        if (typeof firstItem === 'object' && (firstItem.title || firstItem.content)) {
          return value;
        }
      }
    }
  }

  return [];
}

/**
 * JSON 문서 정규화
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeJsonDocument(doc: any, index: number): ParsedDocument | null {
  if (typeof doc !== 'object' || doc === null) {
    throw new Error('문서는 객체여야 합니다.');
  }

  // 제목 추출
  let title = '';
  if (typeof doc.title === 'string') {
    title = doc.title.trim();
  } else if (typeof doc.name === 'string') {
    title = doc.name.trim();
  } else if (typeof doc.subject === 'string') {
    title = doc.subject.trim();
  }

  if (!title) {
    throw new Error('제목이 필요합니다.');
  }

  // 내용 추출
  let content = '';
  if (typeof doc.content === 'string') {
    content = doc.content.trim();
  } else if (typeof doc.body === 'string') {
    content = doc.body.trim();
  } else if (typeof doc.text === 'string') {
    content = doc.text.trim();
  } else if (typeof doc.description === 'string') {
    content = doc.description.trim();
  }

  if (!content) {
    throw new Error('내용이 필요합니다.');
  }

  // 카테고리 추출
  let category: string | undefined;
  if (typeof doc.category === 'string') {
    category = doc.category.trim();
  } else if (typeof doc.type === 'string') {
    category = doc.type.trim();
  } else if (typeof doc.group === 'string') {
    category = doc.group.trim();
  }

  // 태그 추출
  let tags: string[] = [];
  if (Array.isArray(doc.tags)) {
    tags = doc.tags
      .filter((tag: unknown) => typeof tag === 'string')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  } else if (typeof doc.tags === 'string') {
    // 쉼표로 구분된 태그 문자열
    tags = doc.tags
      .split(',')
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0);
  } else if (Array.isArray(doc.keywords)) {
    tags = doc.keywords
      .filter((keyword: unknown) => typeof keyword === 'string')
      .map((keyword: string) => keyword.trim())
      .filter((keyword: string) => keyword.length > 0);
  }

  return {
    title,
    content,
    category,
    tags: tags.length > 0 ? tags : undefined,
    metadata: {
      originalIndex: index,
      source: 'json',
      originalData: doc
    }
  };
}