/**
 * API 응답을 camelCase로 변환하는 transformation utilities
 */

// snake_case를 camelCase로 변환하는 함수
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// 객체의 모든 키를 camelCase로 변환
export function transformObjectToCamelCase<T = any>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectToCamelCase(item)) as T;
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    transformed[camelKey] = typeof value === 'object' && value !== null 
      ? transformObjectToCamelCase(value)
      : value;
  }

  return transformed as T;
}

// API 응답의 문서 객체를 frontend 형식으로 변환
export function transformDocument(doc: any) {
  console.log('transformDocument 입력:', { 
    id: doc.id, 
    title: doc.title, 
    content: doc.content,
    contentLength: doc.content?.length || 0 
  });
  
  const transformed = {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    excerpt: doc.excerpt,
    category: doc.category,
    tags: doc.tags || [],
    wordCount: doc.word_count || 0,
    isFavorite: doc.is_favorite || false,
    status: doc.status,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
    lastModifiedAt: doc.last_modified_at || doc.updated_at,
    userId: doc.user_id,
    aiRequestsUsed: doc.ai_requests_used || 0
  };
  
  console.log('transformDocument 출력:', { 
    id: transformed.id, 
    title: transformed.title, 
    content: transformed.content,
    contentLength: transformed.content?.length || 0 
  });
  
  return transformed;
}

// 문서 배열 변환
export function transformDocuments(docs: any[]) {
  return docs.map(transformDocument);
}

// camelCase를 snake_case로 변환 (API 요청 시 사용)
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// 객체의 모든 키를 snake_case로 변환 (API 요청 시 사용)
export function transformObjectToSnakeCase<T = any>(obj: any): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformObjectToSnakeCase(item)) as T;
  }

  const transformed: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    transformed[snakeKey] = typeof value === 'object' && value !== null 
      ? transformObjectToSnakeCase(value)
      : value;
  }

  return transformed as T;
}

// API 요청용 문서 객체 변환 (camelCase → snake_case)
export function transformDocumentForAPI(doc: any) {
  return {
    title: doc.title,
    content: doc.content,
    category: doc.category,
    tags: doc.tags,
    user_id: doc.userId || doc.user_id,
    status: doc.status,
    excerpt: doc.excerpt,
    word_count: doc.wordCount || doc.word_count,
    is_favorite: doc.isFavorite !== undefined ? doc.isFavorite : doc.is_favorite,
    ai_requests_used: doc.aiRequestsUsed || doc.ai_requests_used || 0
  };
}