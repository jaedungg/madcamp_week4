export interface Document {
  id: string;
  title: string;
  content: string;
  excerpt: string; // First few lines for preview
  wordCount: number;
  category: DocumentCategory;
  tags: string[];
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedAt: Date;
  status: DocumentStatus;
  aiRequestsUsed: number; // Track AI usage per document
  
  // Template-specific fields (optional for backward compatibility)
  isTemplate?: boolean;
  difficulty?: DocumentDifficulty;
  tone?: DocumentTone;
  estimatedWords?: number;
  isBuiltIn?: boolean; // Built-in vs user-created templates
  usageCount?: number; // How many times used as template
  preview?: string; // Template preview text
}

export type DocumentCategory = 
  | 'email' 
  | 'letter' 
  | 'creative' 
  | 'business' 
  | 'personal' 
  | 'draft'
  | 'other';

export type DocumentStatus = 
  | 'draft' 
  | 'completed' 
  | 'archived';

export type DocumentDifficulty = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced';

export type DocumentTone = 
  | 'formal' 
  | 'professional' 
  | 'friendly' 
  | 'casual' 
  | 'creative';

export interface DocumentFilters {
  searchTerm: string;
  category: DocumentCategory | 'all';
  status: DocumentStatus | 'all';
  sortBy: DocumentSortBy;
  sortOrder: 'asc' | 'desc';
  showFavoritesOnly: boolean;
}

export type DocumentSortBy = 
  | 'updatedAt' 
  | 'createdAt' 
  | 'title' 
  | 'wordCount';

export type DocumentViewMode = 'grid' | 'list';

export interface DocumentStats {
  totalDocuments: number;
  totalWords: number;
  favoriteCount: number;
  draftCount: number;
  completedCount: number;
  categoryCounts: Record<DocumentCategory, number>;
}

// For recent documents functionality
export interface RecentDocument extends Document {
  lastAccessedAt: Date;
  timeSpent: number; // minutes spent editing
}

// For document access/modification logs
export interface DocumentAccessLog {
  id: string;
  documentId: string;
  userId: string;
  accessedAt: Date;
  timeSpent: number;
  accessType?: 'view' | 'edit'; // 구분을 위한 optional field
}

// For document modification tracking
export interface DocumentModificationInfo {
  documentId: string;
  userId: string;
  modifiedAt: Date;
  modificationType: 'content' | 'title' | 'category' | 'status' | 'other';
}

// Korean category labels
export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  email: '이메일',
  letter: '편지',
  creative: '창작글',
  business: '업무용',
  personal: '개인적',
  draft: '초안',
  other: '기타'
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: '초안',
  completed: '완료',
  archived: '보관됨'
};

export const DOCUMENT_DIFFICULTY_LABELS: Record<DocumentDifficulty, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급'
};

export const DOCUMENT_TONE_LABELS: Record<DocumentTone, string> = {
  formal: '격식체',
  professional: '전문적',
  friendly: '친근한',
  casual: '캐주얼',
  creative: '창의적'
};