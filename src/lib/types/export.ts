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
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  type?: string;
  tags?: string[];
}

export interface ExportOptions {
  userId: string;
  format: 'json' | 'csv' | 'pdf';
  includeMetadata?: boolean;
}