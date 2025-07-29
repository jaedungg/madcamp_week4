// 문서 내보내기 관련 타입 정의

export interface ExportRequest {
  format: 'json' | 'csv' | 'pdf';
  documentIds?: string[];
  includeContent?: boolean;
}

export interface ExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    count: number;
    format: string;
    fileSize?: number;
    timestamp: string;
  };
}

export interface Document {
  id: string;
  userId: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  word_count: number | null;
  category: string;
  tags: string[];
  status: string | null;
  is_favorite: boolean | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface ExportOptions {
  userId: string;
  format: 'json' | 'csv' | 'pdf';
  includeMetadata?: boolean;
}