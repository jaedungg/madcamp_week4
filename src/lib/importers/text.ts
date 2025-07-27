// 텍스트 파일 파서

import type { FileParseResult, ParsedDocument } from '../types/import';

/**
 * 텍스트 파일 파싱
 * 지원하는 형식:
 * 1. 단일 문서: 파일명을 제목으로, 전체 내용을 본문으로
 * 2. 구분자로 분리된 다중 문서: --- 또는 === 로 구분
 * 3. 제목이 포함된 형식: 첫 줄을 제목으로 처리
 */
export async function parseTextFile(file: File): Promise<FileParseResult> {
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

    // 파일명에서 확장자 제거
    const fileName = file.name.replace(/\.[^/.]+$/, '');

    // 문서 구분자로 분할 시도
    const documents = splitTextIntoDocuments(text, fileName);
    
    if (documents.length === 0) {
      result.errors.push('처리할 수 있는 텍스트가 없습니다.');
      return result;
    }

    // 각 문서 검증 및 정규화
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      
      try {
        const normalizedDoc = normalizeTextDocument(doc, i);
        if (normalizedDoc) {
          result.documents.push(normalizedDoc);
        }
      } catch (error) {
        result.errors.push(`문서 ${i + 1}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }

    result.success = result.documents.length > 0;

  } catch (error) {
    result.errors.push(`파일 읽기 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }

  return result;
}

/**
 * 텍스트를 문서들로 분할
 */
function splitTextIntoDocuments(text: string, fileName: string): Array<{
  title?: string;
  content: string;
  section?: number;
}> {
  // 구분자 패턴들
  const separators = [
    /^---+\s*$/gm,           // --- (마크다운 스타일)
    /^===+\s*$/gm,           // === 
    /^#{3,}\s*$/gm,          // ### (마크다운 헤딩)
    /^\*{3,}\s*$/gm,         // ***
    /^-{10,}\s*$/gm,         // ---------- (긴 대시)
    /^=={10,}\s*$/gm         // ========== (긴 등호)
  ];

  let sections: string[] = [text];

  // 각 구분자로 분할 시도
  for (const separator of separators) {
    const parts = text.split(separator);
    if (parts.length > 1) {
      sections = parts
        .map(part => part.trim())
        .filter(part => part.length > 0);
      break;
    }
  }

  // 각 섹션을 문서로 변환
  return sections.map((section, index) => {
    if (sections.length === 1) {
      // 단일 문서인 경우
      return parseTextSection(section, fileName);
    } else {
      // 다중 문서인 경우
      return parseTextSection(section, `${fileName} (${index + 1})`);
    }
  });
}

/**
 * 텍스트 섹션 파싱
 */
function parseTextSection(text: string, defaultTitle: string): {
  title?: string;
  content: string;
  section?: number;
} {
  const lines = text.split('\n').map(line => line.trim());
  const nonEmptyLines = lines.filter(line => line.length > 0);

  if (nonEmptyLines.length === 0) {
    return {
      title: defaultTitle,
      content: text.trim()
    };
  }

  // 첫 줄이 제목인지 판단
  const firstLine = nonEmptyLines[0];
  const restLines = nonEmptyLines.slice(1);

  // 제목 후보 패턴들
  const titlePatterns = [
    /^#\s+(.+)$/,           // # 제목
    /^##\s+(.+)$/,          // ## 제목
    /^제목:\s*(.+)$/,       // 제목: 내용
    /^Title:\s*(.+)$/i,     // Title: 내용
    /^Subject:\s*(.+)$/i,   // Subject: 내용
    /^주제:\s*(.+)$/,       // 주제: 내용
  ];

  // 패턴 매칭으로 제목 추출
  for (const pattern of titlePatterns) {
    const match = firstLine.match(pattern);
    if (match) {
      return {
        title: match[1].trim(),
        content: restLines.join('\n').trim()
      };
    }
  }

  // 첫 줄이 짧고 나머지와 구분되는 경우 제목으로 간주
  if (firstLine.length <= 100 && 
      restLines.length > 0 && 
      !firstLine.includes('.') && 
      !firstLine.includes('?') &&
      !firstLine.includes('!')) {
    
    const content = restLines.join('\n').trim();
    if (content.length > firstLine.length * 2) {
      return {
        title: firstLine,
        content: content
      };
    }
  }

  // 기본적으로 전체를 내용으로, 기본 제목 사용
  return {
    title: defaultTitle,
    content: text.trim()
  };
}

/**
 * 텍스트 문서 정규화
 */
function normalizeTextDocument(
  doc: { title?: string; content: string; section?: number }, 
  index: number
): ParsedDocument | null {
  const title = doc.title?.trim();
  const content = doc.content?.trim();

  if (!title) {
    throw new Error('제목이 필요합니다.');
  }

  if (!content) {
    throw new Error('내용이 필요합니다.');
  }

  // 내용에서 카테고리나 태그 추출 시도
  let category: string | undefined;
  let tags: string[] | undefined;

  // 내용에서 메타데이터 패턴 찾기
  const categoryMatch = content.match(/^(?:카테고리|Category):\s*(.+)$/im);
  if (categoryMatch) {
    category = categoryMatch[1].trim();
  }

  const tagsMatch = content.match(/^(?:태그|Tags?):\s*(.+)$/im);
  if (tagsMatch) {
    tags = tagsMatch[1]
      .split(/[,;|]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  // 파일 형식에서 카테고리 추정
  if (!category) {
    if (title.includes('이메일') || content.includes('@')) {
      category = '이메일';
    } else if (title.includes('편지') || title.includes('인사')) {
      category = '편지';
    } else if (title.includes('메모') || title.includes('노트')) {
      category = '메모';
    } else if (title.includes('일기') || title.includes('diary')) {
      category = '일기';
    }
  }

  return {
    title,
    content,
    category,
    tags: tags && tags.length > 0 ? tags : undefined,
    metadata: {
      originalIndex: index,
      source: 'text',
      fileName: title,
      hasExtractedTitle: doc.title !== title
    }
  };
}

/**
 * 텍스트 파일 인코딩 감지
 */
export async function detectTextEncoding(file: File): Promise<string> {
  // 첫 4KB만 읽어서 인코딩 감지
  const chunk = file.slice(0, 4096);
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

  // UTF-8 유효성 검사
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    decoder.decode(uint8Array);
    return 'utf-8';
  } catch {
    // UTF-8이 아닌 경우
  }

  // 한글 포함 여부 확인
  const text = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
  const koreanRegex = /[가-힣]/;
  
  if (koreanRegex.test(text)) {
    return 'utf-8'; // 한글이 있으면 UTF-8로 간주
  }

  return 'utf-8'; // 기본값
}