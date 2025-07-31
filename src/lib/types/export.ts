// 문서 내보내기 관련 타입 정의

import { LetterDesign } from '@/types/letter';

export interface ExportRequest {
  format: 'json' | 'csv' | 'pdf' | 'letter';
  documentIds?: string[];
  includeContent?: boolean;
  letterOptions?: {
    design: LetterDesign;
    recipient?: string;
    sender?: string;
    date?: string;
  };
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
  format: 'json' | 'csv' | 'pdf' | 'letter';
  includeMetadata?: boolean;
  letterOptions?: {
    design: LetterDesign;
    recipient?: string;
    sender?: string;
    date?: string;
  };
}