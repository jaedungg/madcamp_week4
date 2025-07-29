// 문서 내보내기 유틸리티 함수들

import { promises as fs } from 'fs';
import path from 'path';
import type { Document, ExportOptions } from '../types/export';
import { prisma } from '../prisma';

/**
 * 사용자별 문서 조회
 */
export async function getDocumentsForUser(
  userId: string,
  documentIds?: string[],
  includeContent = true
): Promise<any[]> {
  const whereClause: any = {
    user_id: userId
  };

  if (documentIds && documentIds.length > 0) {
    whereClause.id = { in: documentIds };
  }

  const documents = await prisma.documents.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
      status: true,
      is_favorite: true,
      created_at: true,
      updated_at: true,
      ...(includeContent ? { content: true, excerpt: true, word_count: true } : {})
    }
  });

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