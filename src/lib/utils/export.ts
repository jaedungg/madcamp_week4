// 문서 내보내기 유틸리티 함수들

import { promises as fs } from 'fs';
import path from 'path';
import type { Document, ExportOptions } from '../types/export';

// 샘플 문서 데이터 (실제로는 데이터베이스에서 조회)
const SAMPLE_DOCUMENTS: Document[] = [
  {
    id: 'doc1',
    title: '업무 이메일 초안',
    content: '안녕하세요. 업무 관련 문의드립니다. 프로젝트 진행 상황에 대해 논의하고 싶습니다.',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
    userId: 'user123',
    type: 'business-email',
    tags: ['업무', '이메일']
  },
  {
    id: 'doc2',
    title: '감사 인사말',
    content: '진심으로 감사드립니다. 도움을 주신 덕분에 좋은 결과를 얻을 수 있었습니다.',
    createdAt: new Date('2024-01-16T14:20:00Z'),
    updatedAt: new Date('2024-01-16T14:25:00Z'),
    userId: 'user123',
    type: 'personal-letter',
    tags: ['감사', '인사말']
  },
  {
    id: 'doc3',
    title: '프로젝트 제안서',
    content: '새로운 프로젝트를 제안드립니다. 해당 프로젝트는 회사의 디지털 전환을 가속화할 것입니다.',
    createdAt: new Date('2024-01-17T11:15:00Z'),
    updatedAt: new Date('2024-01-18T09:45:00Z'),
    userId: 'user123',
    type: 'business-proposal',
    tags: ['제안서', '프로젝트']
  }
];

/**
 * 사용자별 문서 조회
 */
export async function getDocumentsForUser(
  userId: string,
  documentIds?: string[],
  includeContent = true
): Promise<Document[]> {
  // 실제로는 데이터베이스 쿼리를 수행
  let documents = SAMPLE_DOCUMENTS.filter(doc => doc.userId === userId);

  // 특정 문서 ID들만 필터링
  if (documentIds && documentIds.length > 0) {
    documents = documents.filter(doc => documentIds.includes(doc.id));
  }

  // 내용 제외 옵션
  if (!includeContent) {
    documents = documents.map(doc => ({
      ...doc,
      content: '' // 내용 제거
    }));
  }

  return documents;
}

/**
 * 파일 크기 추정
 */
export function estimateFileSize(documents: Document[], format: string): number {
  const totalContentSize = documents.reduce((sum, doc) => {
    return sum + JSON.stringify(doc).length;
  }, 0);

  const formatMultiplier = {
    json: 1.2,
    csv: 0.8,
    pdf: 3.0
  };

  return Math.ceil(totalContentSize * (formatMultiplier[format as keyof typeof formatMultiplier] || 1));
}

/**
 * 요청 검증
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateExportRequest(body: any): { isValid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: '올바른 요청 형식이 아닙니다.' };
  }

  if (!body.format || !['json', 'csv', 'pdf'].includes(body.format)) {
    return { isValid: false, error: '지원하지 않는 형식입니다. (json, csv, pdf 중 선택)' };
  }

  if (body.documentIds && (!Array.isArray(body.documentIds) || body.documentIds.length > 100)) {
    return { isValid: false, error: '문서 ID 목록이 올바르지 않거나 너무 많습니다. (최대 100개)' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (body.documentIds && body.documentIds.some((id: any) => typeof id !== 'string')) {
    return { isValid: false, error: '문서 ID는 문자열이어야 합니다.' };
  }

  return { isValid: true };
}

/**
 * 사용자 인증 (간단한 예시 구현)
 */
export async function authenticateUser(request: Request): Promise<{ success: boolean; userId?: string }> {
  try {
    // 실제로는 JWT 토큰이나 세션을 확인
    const authHeader = request.headers.get('authorization');

    // 예시: Bearer 토큰 형식 확인
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false };
    }

    const token = authHeader.substring(7);

    // 간단한 토큰 검증 (실제로는 JWT 라이브러리나 세션 스토어 사용)
    if (token === 'test-token') {
      return { success: true, userId: 'user123' };
    }

    return { success: false };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false };
  }
}

/**
 * Rate limiting 체크 (간단한 메모리 기반 구현)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function isRateLimited(clientIP: string): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1분
  const maxRequests = 10; // 분당 최대 10회

  const clientData = rateLimitMap.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // 새로운 윈도우 시작
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (clientData.count >= maxRequests) {
    return true; // Rate limited
  }

  // 카운트 증가
  clientData.count++;
  return false;
}

/**
 * 임시 파일 정리
 */
export async function cleanupTempFiles(): Promise<void> {
  try {
    const exportsDir = path.join(process.cwd(), 'public/exports/temp');
    const files = await fs.readdir(exportsDir);
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(exportsDir, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > oneHour) {
        await fs.unlink(filePath);
        console.log(`임시 파일 삭제됨: ${file}`);
      }
    }
  } catch (error) {
    console.error('임시 파일 정리 중 오류:', error);
  }
}