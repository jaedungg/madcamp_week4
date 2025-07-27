// 문서 가져오기 유틸리티 함수들

import { prisma } from '@/lib/prisma';
import sanitizeHtml from 'sanitize-html';
import type { 
  ParsedDocument, 
  ImportedDocument, 
  ImportResult, 
  DuplicateCheckResult,
  BatchImportResult,
  ImportValidationResult,
  SupportedFileType 
} from '../types/import';

// 파일 크기 제한 (바이트)
const MAX_FILE_SIZE = {
  json: 10 * 1024 * 1024,  // 10MB
  csv: 5 * 1024 * 1024,    // 5MB
  txt: 2 * 1024 * 1024     // 2MB
};

// 문서당 최대 글자 수
const MAX_CONTENT_LENGTH = 50000; // 50K 글자

/**
 * 파일 타입 검증
 */
export function validateFileType(file: File): { isValid: boolean; type?: SupportedFileType; error?: string } {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  if (fileName.endsWith('.json') || fileType === 'application/json') {
    return { isValid: true, type: 'json' };
  }
  
  if (fileName.endsWith('.csv') || fileType === 'text/csv') {
    return { isValid: true, type: 'csv' };
  }
  
  if (fileName.endsWith('.txt') || fileType === 'text/plain') {
    return { isValid: true, type: 'txt' };
  }

  return { 
    isValid: false, 
    error: '지원하지 않는 파일 형식입니다. JSON, CSV, TXT 파일만 업로드 가능합니다.' 
  };
}

/**
 * 파일 크기 검증
 */
export function validateFileSize(file: File, type: SupportedFileType): ImportValidationResult {
  const maxSize = MAX_FILE_SIZE[type];
  
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. ${type.toUpperCase()} 파일의 최대 크기는 ${maxSizeMB}MB입니다.`
    };
  }

  return { isValid: true };
}

/**
 * 문서 데이터 검증
 */
export function validateDocumentData(doc: ParsedDocument): ImportValidationResult {
  const warnings: string[] = [];

  // 필수 필드 검증
  if (!doc.title?.trim()) {
    return { isValid: false, error: '문서 제목이 필요합니다.' };
  }

  if (!doc.content?.trim()) {
    return { isValid: false, error: '문서 내용이 필요합니다.' };
  }

  // 길이 제한 검증
  if (doc.title.length > 255) {
    return { isValid: false, error: '제목이 너무 깁니다. (최대 255자)' };
  }

  if (doc.content.length > MAX_CONTENT_LENGTH) {
    return { 
      isValid: false, 
      error: `내용이 너무 깁니다. (최대 ${MAX_CONTENT_LENGTH.toLocaleString()}자)` 
    };
  }

  // 기본값 설정 경고
  if (!doc.category) {
    warnings.push('카테고리가 설정되지 않아 "기타"로 설정됩니다.');
  }

  return { isValid: true, warnings };
}

/**
 * HTML 콘텐츠 정화
 */
export function sanitizeContent(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
    allowedAttributes: {},
    textFilter: (text: string) => {
      // 불필요한 공백 제거
      return text.replace(/\s+/g, ' ').trim();
    }
  });
}

/**
 * 중복 문서 확인
 */
export async function checkDuplicate(
  title: string, 
  userId: string, 
  updateExisting = false
): Promise<DuplicateCheckResult> {
  try {
    const existingDoc = await prisma.documents.findFirst({
      where: {
        title: title.trim(),
        user_id: userId
      },
      select: { id: true }
    });

    if (existingDoc) {
      return {
        isDuplicate: true,
        existingDocumentId: existingDoc.id,
        action: updateExisting ? 'update' : 'skip'
      };
    }

    return {
      isDuplicate: false,
      action: 'create'
    };
  } catch (error) {
    console.error('Error checking duplicate:', error);
    // 오류 시 안전하게 새로 생성
    return {
      isDuplicate: false,
      action: 'create'
    };
  }
}

/**
 * 문서 생성
 */
export async function createDocument(
  doc: ParsedDocument, 
  userId: string
): Promise<ImportResult> {
  try {
    // 내용 정화
    const sanitizedContent = sanitizeContent(doc.content);
    const sanitizedTitle = sanitizeContent(doc.title);

    // 기본값 설정
    const category = doc.category || '기타';
    const tags = doc.tags || [];
    const excerpt = sanitizedContent.slice(0, 200);
    const wordCount = sanitizedContent.trim().split(/\s+/).length;

    const document = await prisma.documents.create({
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
        category,
        tags,
        user_id: userId,
        excerpt,
        word_count: wordCount,
        status: 'draft'
      }
    });

    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        content: document.content || '',
        category: document.category,
        tags: document.tags,
        excerpt: document.excerpt || '',
        word_count: document.word_count || 0,
        created_at: document.created_at || new Date(),
        updated_at: document.updated_at || new Date()
      }
    };
  } catch (error) {
    console.error('Error creating document:', error);
    return {
      success: false,
      error: '문서 생성 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 문서 업데이트
 */
export async function updateDocument(
  doc: ParsedDocument, 
  documentId: string, 
  userId: string
): Promise<ImportResult> {
  try {
    // 권한 확인
    const existingDoc = await prisma.documents.findFirst({
      where: {
        id: documentId,
        user_id: userId
      }
    });

    if (!existingDoc) {
      return {
        success: false,
        error: '수정 권한이 없습니다.'
      };
    }

    // 내용 정화
    const sanitizedContent = sanitizeContent(doc.content);
    const sanitizedTitle = sanitizeContent(doc.title);

    const category = doc.category || existingDoc.category;
    const tags = doc.tags || existingDoc.tags;
    const excerpt = sanitizedContent.slice(0, 200);
    const wordCount = sanitizedContent.trim().split(/\s+/).length;

    const document = await prisma.documents.update({
      where: { id: documentId },
      data: {
        title: sanitizedTitle,
        content: sanitizedContent,
        category,
        tags,
        excerpt,
        word_count: wordCount,
        updated_at: new Date(),
        last_modified_at: new Date()
      }
    });

    return {
      success: true,
      document: {
        id: document.id,
        title: document.title,
        content: document.content || '',
        category: document.category,
        tags: document.tags,
        excerpt: document.excerpt || '',
        word_count: document.word_count || 0,
        created_at: document.created_at || new Date(),
        updated_at: document.updated_at || new Date()
      }
    };
  } catch (error) {
    console.error('Error updating document:', error);
    return {
      success: false,
      error: '문서 업데이트 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 배치 문서 처리
 */
export async function processBatchImport(
  documents: ParsedDocument[],
  userId: string,
  options: { skipDuplicates?: boolean; updateExisting?: boolean } = {}
): Promise<BatchImportResult> {
  const result: BatchImportResult = {
    totalProcessed: documents.length,
    successful: [],
    failed: [],
    skipped: []
  };

  // 트랜잭션으로 배치 처리
  try {
    for (const doc of documents) {
      // 문서 데이터 검증
      const validation = validateDocumentData(doc);
      if (!validation.isValid) {
        result.failed.push({
          document: doc,
          error: validation.error || '알 수 없는 검증 오류'
        });
        continue;
      }

      // 중복 확인
      const duplicateCheck = await checkDuplicate(
        doc.title, 
        userId, 
        options.updateExisting
      );

      if (duplicateCheck.isDuplicate && duplicateCheck.action === 'skip') {
        if (options.skipDuplicates !== false) {
          result.skipped.push({
            document: doc,
            reason: '동일한 제목의 문서가 이미 존재합니다.'
          });
          continue;
        }
      }

      // 문서 생성 또는 업데이트
      let importResult: ImportResult;
      
      if (duplicateCheck.action === 'update' && duplicateCheck.existingDocumentId) {
        importResult = await updateDocument(doc, duplicateCheck.existingDocumentId, userId);
      } else {
        importResult = await createDocument(doc, userId);
      }

      if (importResult.success && importResult.document) {
        result.successful.push(importResult.document);
      } else {
        result.failed.push({
          document: doc,
          error: importResult.error || '알 수 없는 오류'
        });
      }
    }
  } catch (error) {
    console.error('Batch import error:', error);
    // 남은 문서들을 실패로 처리
    const remainingDocs = documents.slice(result.successful.length + result.failed.length + result.skipped.length);
    remainingDocs.forEach(doc => {
      result.failed.push({
        document: doc,
        error: '배치 처리 중 시스템 오류가 발생했습니다.'
      });
    });
  }

  return result;
}

/**
 * Rate limiting 체크 (가져오기용, 더 엄격한 제한)
 */
const importRateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function isImportRateLimited(clientIP: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1분
  const maxRequests = 5; // 분당 최대 5회 (내보내기보다 엄격)

  const clientData = importRateLimitMap.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // 새로운 윈도우 시작
    importRateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (clientData.count >= maxRequests) {
    return true; // Rate limited
  }

  // 카운트 증가
  clientData.count++;
  return false;
}