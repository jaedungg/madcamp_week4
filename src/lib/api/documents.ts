// src/lib/api/documents.ts
import { RecentDocument } from '@/types/document';

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface FetchRecentDocumentsResponse {
  success: boolean;
  documents: RecentDocument[];
  error?: string;
}

interface LogDocumentAccessRequest {
  document_id: string;
  user_id: string;
  time_spent?: number;
}

interface LogDocumentAccessResponse {
  success: boolean;
  error?: string;
}

// API 기본 설정
const API_BASE_URL = process.env.NODE_ENV === 'development' ? '' : '';

// 간단한 캐시 구현
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class SimpleCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL = 5 * 60 * 1000; // 5분

  set(key: string, data: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, timestamp: Date.now(), expiry });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

// 최근 문서 캐시
const recentDocumentsCache = new SimpleCache<RecentDocument[]>();

// 에러 처리 유틸리티
class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// HTTP 요청 래퍼 함수
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error || `HTTP ${response.status}`,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // 네트워크 에러 등
    throw new ApiError(
      0,
      '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
      error
    );
  }
}

/**
 * 최근 문서 목록을 가져옵니다
 * @param userId 사용자 ID
 * @param limit 가져올 문서 수 (기본값: 50)
 * @returns 최근 문서 목록
 */
export async function fetchRecentDocuments(
  userId: string,
  limit: number = 50,
  useCache: boolean = true
): Promise<RecentDocument[]> {
  if (!userId) {
    throw new ApiError(400, '사용자 ID가 필요합니다.');
  }

  // 캐시 키 생성
  const cacheKey = `recent_docs_${userId}_${limit}`;

  // 캐시에서 데이터 확인
  if (useCache) {
    const cachedData = recentDocumentsCache.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  try {
    const params = new URLSearchParams({
      user_id: userId,
      limit: limit.toString(),
    });

    const response = await apiRequest<FetchRecentDocumentsResponse>(
      `/api/documents/recent?${params.toString()}`
    );

    if (!response.success) {
      throw new ApiError(500, response.error || '최근 문서를 가져오는데 실패했습니다.');
    }

    // 날짜 문자열을 Date 객체로 변환
    const documents = response.documents.map(doc => ({
      ...doc,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
      lastModifiedAt: new Date(doc.lastModifiedAt),
      lastAccessedAt: new Date(doc.lastAccessedAt),
    }));

    // 캐시에 저장 (성공한 경우에만)
    if (useCache) {
      recentDocumentsCache.set(cacheKey, documents);
    }

    return documents;
  } catch (error) {
    console.error('Error fetching recent documents:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, '최근 문서를 가져오는 중 오류가 발생했습니다.');
  }
}

/**
 * 문서 수정 로그를 기록합니다 (수정을 접근으로 취급하여 최근 문서에 반영)
 * @param documentId 문서 ID
 * @param userId 사용자 ID
 * @returns 성공 여부
 */
export async function logDocumentModification(
  documentId: string,
  userId: string
): Promise<boolean> {
  if (!documentId || !userId) {
    throw new ApiError(400, '문서 ID와 사용자 ID가 필요합니다.');
  }

  try {
    const requestData: LogDocumentAccessRequest = {
      document_id: documentId,
      user_id: userId,
      time_spent: 0, // 수정 시에는 0으로 설정
    };

    const response = await apiRequest<LogDocumentAccessResponse>(
      `/api/documents/${documentId}/access`,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      }
    );

    if (!response.success) {
      throw new ApiError(500, response.error || '문서 수정 로그 저장에 실패했습니다.');
    }

    // 수정 후 캐시 무효화
    invalidateCache(userId);

    return true;
  } catch (error) {
    console.error('Error logging document modification:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, '문서 수정 로그 저장 중 오류가 발생했습니다.');
  }
}

/**
 * 문서 접근 로그를 기록합니다
 * @param documentId 문서 ID
 * @param userId 사용자 ID
 * @param timeSpent 문서에서 보낸 시간 (분 단위, 선택사항)
 * @returns 성공 여부
 */
export async function logDocumentAccess(
  documentId: string,
  userId: string,
  timeSpent: number = 0
): Promise<boolean> {
  if (!documentId || !userId) {
    throw new ApiError(400, '문서 ID와 사용자 ID가 필요합니다.');
  }

  try {
    const requestData: LogDocumentAccessRequest = {
      document_id: documentId,
      user_id: userId,
      time_spent: Math.max(0, Math.round(timeSpent)), // 음수 방지 및 정수로 변환
    };

    const response = await apiRequest<LogDocumentAccessResponse>(
      `/api/documents/${documentId}/access`,
      {
        method: 'POST',
        body: JSON.stringify(requestData),
      }
    );

    if (!response.success) {
      throw new ApiError(500, response.error || '문서 접근 로그 저장에 실패했습니다.');
    }

    return true;
  } catch (error) {
    console.error('Error logging document access:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(500, '문서 접근 로그 저장 중 오류가 발생했습니다.');
  }
}

/**
 * API 에러인지 확인하는 타입 가드
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 에러 메시지를 사용자 친화적으로 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getErrorMessage(error: any): string {
  if (isApiError(error)) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했습니다.';
}

// 재시도 로직이 포함된 API 호출 함수
export async function fetchRecentDocumentsWithRetry(
  userId: string,
  limit: number = 50,
  maxRetries: number = 3
): Promise<RecentDocument[]> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fetchRecentDocuments(userId, limit);
    } catch (error) {
      lastError = error as Error;

      // API 에러이고 4xx 상태코드면 재시도하지 않음
      if (isApiError(error) && error.status >= 400 && error.status < 500) {
        throw error;
      }

      // 마지막 시도가 아니면 잠시 대기
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // lastError가 null인 경우는 실제로 불가능하지만 TypeScript를 위한 방어 코드
  throw lastError || new ApiError(500, '알 수 없는 오류가 발생했습니다.');
}

/**
 * 캐시를 무효화합니다
 * @param userId 특정 사용자의 캐시만 삭제 (선택사항)
 */
export function invalidateCache(userId?: string): void {
  if (userId) {
    // 특정 사용자의 캐시만 삭제
    recentDocumentsCache.delete(`recent_docs_${userId}_50`);
    recentDocumentsCache.delete(`recent_docs_${userId}_10`);
    recentDocumentsCache.delete(`recent_docs_${userId}_20`);
  } else {
    // 전체 캐시 삭제
    recentDocumentsCache.clear();
  }
}

/**
 * 문서 작업 후 캐시를 업데이트합니다
 * @param userId 사용자 ID
 */
export function refreshCache(userId: string): void {
  invalidateCache(userId);
}