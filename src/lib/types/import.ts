// 문서 가져오기 관련 타입 정의

export interface ImportRequest {
  file: File;
  options?: ImportOptions;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  category?: string;
  tags?: string[];
}

export interface ImportResponse {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  documents: ImportedDocument[];
}

export interface ImportedDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  excerpt?: string;
  word_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ParsedDocument {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  document?: ImportedDocument;
  error?: string;
  skipped?: boolean;
  reason?: string;
}

export interface FileParseResult {
  success: boolean;
  documents: ParsedDocument[];
  errors: string[];
}

export interface ImportValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export type SupportedFileType = 'json' | 'csv' | 'txt';

export interface FileParserOptions {
  encoding?: string;
  maxFileSize?: number;
  maxDocuments?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingDocumentId?: string;
  action: 'skip' | 'update' | 'create';
}

export interface BatchImportResult {
  totalProcessed: number;
  successful: ImportedDocument[];
  failed: Array<{
    document: ParsedDocument;
    error: string;
  }>;
  skipped: Array<{
    document: ParsedDocument;
    reason: string;
  }>;
}