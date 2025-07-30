import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import {
  Document,
  DocumentCategory,
  DocumentStatus,
  DocumentFilters,
  DocumentSortBy,
  DocumentViewMode,
  DocumentStats,
  RecentDocument,
  DocumentDifficulty,
  DocumentTone,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_DIFFICULTY_LABELS,
  DOCUMENT_TONE_LABELS
} from '@/types/document';
import { createExcerptFromHtml, countWordsFromHtml } from '@/lib/utils/excerpt';
// Template types removed - templates now managed through API without frontend type conversion

interface DocumentState {
  // Document data
  documents: Document[];
  recentDocuments: RecentDocument[];
  
  // UI state
  filters: DocumentFilters;
  viewMode: DocumentViewMode;
  selectedDocuments: string[];
  isLoading: boolean;
  
  // Document management
  createDocument: (title?: string, category?: DocumentCategory) => Document;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  deleteDocument: (id: string) => void;
  duplicateDocument: (id: string) => Document;
  toggleFavorite: (id: string) => void;
  
  // Content management
  updateContent: (id: string, content: string) => void;
  updateTitle: (id: string, title: string) => void;
  updateCategory: (id: string, category: DocumentCategory) => void;
  updateStatus: (id: string, status: DocumentStatus) => void;
  
  // Recent documents
  markAsRecent: (id: string, timeSpent?: number) => void;
  getRecentDocuments: (limit?: number) => RecentDocument[];
  
  // Filtering and sorting
  setFilters: (filters: Partial<DocumentFilters>) => void;
  resetFilters: () => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: DocumentSortBy) => void;
  setViewMode: (mode: DocumentViewMode) => void;
  
  // Selection
  selectDocument: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  
  // Statistics
  getStats: () => DocumentStats;
  getFilteredDocuments: () => Document[];
  
  // Data management
  exportDocuments: () => Promise<Blob>;
  importDocuments: (documents: Document[]) => void;
  
  // Template management
  getTemplateDocuments: () => Document[];
  createTemplateDocument: (title: string, category: DocumentCategory, difficulty?: DocumentDifficulty, tone?: DocumentTone) => Document;
  convertToTemplate: (id: string, difficulty: DocumentDifficulty, tone: DocumentTone, estimatedWords?: number) => void;
  convertFromTemplate: (id: string) => void;
  useTemplate: (id: string) => void; // Increment usage count
  getTemplatesByCategory: (category: DocumentCategory) => Document[];
  getPopularTemplates: (limit?: number) => Document[];
  getFavoriteTemplates: () => Document[];
  getTemplateStats: () => { totalTemplates: number; builtInCount: number; userCreatedCount: number; favoriteCount: number; totalUsage: number; categoryCounts: Record<DocumentCategory, number>; popularTemplates: Document[]; };
}

// Default filters
const defaultFilters: DocumentFilters = {
  searchTerm: '',
  category: 'all',
  status: 'all',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  showFavoritesOnly: false
};

// Sample documents with Korean content
const sampleDocuments: Document[] = [
  {
    id: 'doc-1',
    title: '김대리님께 업무 협조 요청',
    content: '안녕하세요, 김대리님.\n\n이번 프로젝트 관련하여 협조를 요청드리고 싶어 연락드립니다...',
    excerpt: '안녕하세요, 김대리님. 이번 프로젝트 관련하여 협조를 요청드리고 싶어...',
    wordCount: 245,
    category: 'email',
    tags: ['업무', '협조요청', '프로젝트'],
    isFavorite: true,
    createdAt: new Date('2024-01-10T09:00:00Z'),
    updatedAt: new Date('2024-01-15T14:30:00Z'),
    lastModifiedAt: new Date('2024-01-15T14:30:00Z'),
    status: 'completed',
    aiRequestsUsed: 3
  },
  {
    id: 'doc-2',
    title: '어머니께 보내는 편지',
    content: '사랑하는 어머니께\n\n오랜만에 안부 인사를 드립니다. 바쁜 일상 속에서도 항상 건강하시길...',
    excerpt: '사랑하는 어머니께. 오랜만에 안부 인사를 드립니다. 바쁜 일상 속에서도...',
    wordCount: 189,
    category: 'letter',
    tags: ['가족', '안부', '개인적'],
    isFavorite: false,
    createdAt: new Date('2024-01-12T15:20:00Z'),
    updatedAt: new Date('2024-01-14T10:15:00Z'),
    lastModifiedAt: new Date('2024-01-14T10:15:00Z'),
    status: 'completed',
    aiRequestsUsed: 2
  },
  {
    id: 'doc-3',
    title: '새해 다짐과 목표',
    content: '2024년 새해를 맞이하며...\n\n올해는 더욱 성장하는 한 해가 되기를 바라며 몇 가지 목표를 세워보았다.',
    excerpt: '2024년 새해를 맞이하며... 올해는 더욱 성장하는 한 해가 되기를...',
    wordCount: 156,
    category: 'creative',
    tags: ['새해', '목표', '다짐', '개인성장'],
    isFavorite: true,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-13T20:45:00Z'),
    lastModifiedAt: new Date('2024-01-13T20:45:00Z'),
    status: 'completed',
    aiRequestsUsed: 1
  },
  {
    id: 'doc-4',
    title: '회의록 - 분기 실적 검토',
    content: '# 2024년 1분기 실적 검토 회의\n\n## 참석자\n- 팀장: 이과장\n- 팀원: 김대리, 박주임...',
    excerpt: '2024년 1분기 실적 검토 회의. 참석자: 팀장 이과장, 팀원 김대리...',
    wordCount: 324,
    category: 'business',
    tags: ['회의록', '실적검토', '업무'],
    isFavorite: false,
    createdAt: new Date('2024-01-08T16:00:00Z'),
    updatedAt: new Date('2024-01-08T17:30:00Z'),
    lastModifiedAt: new Date('2024-01-08T17:30:00Z'),
    status: 'completed',
    aiRequestsUsed: 5
  },
  {
    id: 'doc-5',
    title: '제목 없는 문서',
    content: '오늘 하루를 돌아보며...',
    excerpt: '오늘 하루를 돌아보며...',
    wordCount: 23,
    category: 'draft',
    tags: ['일기', '임시저장'],
    isFavorite: false,
    createdAt: new Date('2024-01-16T22:15:00Z'),
    updatedAt: new Date('2024-01-16T22:15:00Z'),
    lastModifiedAt: new Date('2024-01-16T22:15:00Z'),
    status: 'draft',
    aiRequestsUsed: 0
  }
];

// Helper functions
const generateId = () => uuidv4();

// convertTemplateToDocument function removed - no longer needed
// Templates are now loaded directly from API without frontend conversion

// Built-in templates are now loaded from the database via API calls
// This eliminates duplication between frontend hardcoded data and database seeding

// 이제 새로운 유틸리티 함수들을 사용
const generateExcerpt = (content: string, maxLength = 100): string => {
  return createExcerptFromHtml(content, maxLength);
};

const countWords = (content: string): number => {
  return countWordsFromHtml(content);
};

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      // Initial state
      documents: [...sampleDocuments], // Built-in templates are loaded from API
      recentDocuments: [],
      filters: defaultFilters,
      viewMode: 'grid',
      selectedDocuments: [],
      isLoading: false,

      // Document management
      createDocument: (title = '제목 없는 문서', category = 'draft') => {
        const newDocument: Document = {
          id: generateId(),
          title,
          content: '',
          excerpt: '',
          wordCount: 0,
          category,
          tags: [],
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedAt: new Date(),
          status: 'draft',
          aiRequestsUsed: 0
        };

        set((state) => ({
          documents: [newDocument, ...state.documents]
        }));

        return newDocument;
      },

      updateDocument: (id, updates) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? {
                  ...doc,
                  ...updates,
                  updatedAt: new Date(),
                  lastModifiedAt: new Date(),
                  ...(updates.content && {
                    excerpt: generateExcerpt(updates.content),
                    wordCount: countWords(updates.content)
                  })
                }
              : doc
          )
        }));
        
        // 문서가 업데이트된 후 자동으로 최근 문서에 추가
        const { markAsRecent } = get();
        markAsRecent(id);
      },

      deleteDocument: (id) => {
        set((state) => ({
          documents: state.documents.filter(doc => doc.id !== id),
          selectedDocuments: state.selectedDocuments.filter(docId => docId !== id),
          recentDocuments: state.recentDocuments.filter(doc => doc.id !== id)
        }));
      },

      duplicateDocument: (id) => {
        const state = get();
        const originalDoc = state.documents.find(doc => doc.id === id);
        
        if (!originalDoc) {
          throw new Error('Document not found');
        }

        const duplicatedDoc: Document = {
          ...originalDoc,
          id: generateId(),
          title: `${originalDoc.title} (복사본)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedAt: new Date(),
          status: 'draft',
          isFavorite: false,
          aiRequestsUsed: 0
        };

        set((state) => ({
          documents: [duplicatedDoc, ...state.documents]
        }));

        return duplicatedDoc;
      },

      toggleFavorite: (id) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? { ...doc, isFavorite: !doc.isFavorite, updatedAt: new Date() }
              : doc
          )
        }));
      },

      // Content management
      updateContent: (id, content) => {
        const { updateDocument } = get();
        updateDocument(id, { 
          content,
          excerpt: generateExcerpt(content),
          wordCount: countWords(content)
        });
      },

      updateTitle: (id, title) => {
        const { updateDocument } = get();
        updateDocument(id, { title });
      },

      updateCategory: (id, category) => {
        const { updateDocument } = get();
        updateDocument(id, { category });
      },

      updateStatus: (id, status) => {
        const { updateDocument } = get();
        updateDocument(id, { status });
      },

      // Recent documents
      markAsRecent: (id, timeSpent = 0) => {
        const state = get();
        const document = state.documents.find(doc => doc.id === id);
        
        if (!document) return;

        const recentDoc: RecentDocument = {
          ...document,
          lastAccessedAt: new Date(),
          timeSpent
        };

        set((state) => {
          const filteredRecent = state.recentDocuments.filter(doc => doc.id !== id);
          return {
            recentDocuments: [recentDoc, ...filteredRecent].slice(0, 20) // Keep last 20
          };
        });
      },

      getRecentDocuments: (limit = 10) => {
        const state = get();
        return state.recentDocuments
          .sort((a, b) => b.lastAccessedAt.getTime() - a.lastAccessedAt.getTime())
          .slice(0, limit);
      },

      // Filtering and sorting
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters }
        }));
      },

      resetFilters: () => {
        set({ filters: defaultFilters });
      },

      setSearchTerm: (searchTerm) => {
        set((state) => ({
          filters: { ...state.filters, searchTerm }
        }));
      },

      setSortBy: (sortBy) => {
        set((state) => ({
          filters: { ...state.filters, sortBy }
        }));
      },

      setViewMode: (viewMode) => {
        set({ viewMode });
      },

      // Selection
      selectDocument: (id) => {
        set((state) => ({
          selectedDocuments: state.selectedDocuments.includes(id)
            ? state.selectedDocuments.filter(docId => docId !== id)
            : [...state.selectedDocuments, id]
        }));
      },

      selectMultiple: (ids) => {
        set({ selectedDocuments: ids });
      },

      clearSelection: () => {
        set({ selectedDocuments: [] });
      },

      deleteSelected: () => {
        const state = get();
        const idsToDelete = state.selectedDocuments;
        
        set((state) => ({
          documents: state.documents.filter(doc => !idsToDelete.includes(doc.id)),
          selectedDocuments: [],
          recentDocuments: state.recentDocuments.filter(doc => !idsToDelete.includes(doc.id))
        }));
      },

      // Statistics
      getStats: () => {
        const state = get();
        const docs = state.documents;

        const categoryCounts = docs.reduce((acc, doc) => {
          acc[doc.category] = (acc[doc.category] || 0) + 1;
          return acc;
        }, {} as Record<DocumentCategory, number>);

        return {
          totalDocuments: docs.length,
          totalWords: docs.reduce((sum, doc) => sum + doc.wordCount, 0),
          favoriteCount: docs.filter(doc => doc.isFavorite).length,
          draftCount: docs.filter(doc => doc.status === 'draft').length,
          completedCount: docs.filter(doc => doc.status === 'completed').length,
          categoryCounts
        };
      },

      getFilteredDocuments: () => {
        const state = get();
        const { documents, filters } = state;

        let filtered = [...documents];

        // Apply filters
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filtered = filtered.filter(doc =>
            doc.title.toLowerCase().includes(term) ||
            doc.content.toLowerCase().includes(term) ||
            doc.tags.some(tag => tag.toLowerCase().includes(term))
          );
        }

        if (filters.category !== 'all') {
          filtered = filtered.filter(doc => doc.category === filters.category);
        }

        if (filters.status !== 'all') {
          filtered = filtered.filter(doc => doc.status === filters.status);
        }

        if (filters.showFavoritesOnly) {
          filtered = filtered.filter(doc => doc.isFavorite);
        }

        // Apply sorting
        filtered.sort((a, b) => {
          const aValue = a[filters.sortBy];
          const bValue = b[filters.sortBy];

          if (aValue instanceof Date && bValue instanceof Date) {
            return filters.sortOrder === 'desc'
              ? bValue.getTime() - aValue.getTime()
              : aValue.getTime() - bValue.getTime();
          }

          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return filters.sortOrder === 'desc'
              ? bValue.localeCompare(aValue, 'ko')
              : aValue.localeCompare(bValue, 'ko');
          }

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return filters.sortOrder === 'desc'
              ? bValue - aValue
              : aValue - bValue;
          }

          return 0;
        });

        return filtered;
      },

      // Data management
      exportDocuments: async () => {
        const state = get();
        const exportData = {
          documents: state.documents,
          recentDocuments: state.recentDocuments,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });

        return blob;
      },

      importDocuments: (importedDocs) => {
        set((state) => {
          const existingIds = new Set(state.documents.map(doc => doc.id));
          const newDocs = importedDocs.filter(doc => !existingIds.has(doc.id));
          
          return {
            documents: [...state.documents, ...newDocs]
          };
        });
      },

      // Template management
      getTemplateDocuments: () => {
        const state = get();
        return state.documents.filter(doc => doc.isTemplate === true);
      },

      createTemplateDocument: (title, category, difficulty = 'beginner', tone = 'professional') => {
        const newTemplate: Document = {
          id: generateId(),
          title,
          content: '',
          excerpt: '',
          wordCount: 0,
          category,
          tags: [],
          isFavorite: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastModifiedAt: new Date(),
          status: 'completed',
          aiRequestsUsed: 0,
          // Template-specific fields
          isTemplate: true,
          difficulty,
          tone,
          estimatedWords: 0,
          isBuiltIn: false,
          usageCount: 0,
          preview: ''
        };

        set((state) => ({
          documents: [newTemplate, ...state.documents]
        }));

        return newTemplate;
      },

      convertToTemplate: (id, difficulty, tone, estimatedWords) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? {
                  ...doc,
                  isTemplate: true,
                  difficulty,
                  tone,
                  estimatedWords: estimatedWords || doc.wordCount,
                  isBuiltIn: false,
                  usageCount: 0,
                  preview: doc.excerpt,
                  updatedAt: new Date()
                }
              : doc
          )
        }));
      },

      convertFromTemplate: (id) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id
              ? {
                  ...doc,
                  isTemplate: false,
                  difficulty: undefined,
                  tone: undefined,
                  estimatedWords: undefined,
                  isBuiltIn: undefined,
                  usageCount: undefined,
                  preview: undefined,
                  updatedAt: new Date()
                }
              : doc
          )
        }));
      },

      useTemplate: (id) => {
        set((state) => ({
          documents: state.documents.map(doc =>
            doc.id === id && doc.isTemplate
              ? {
                  ...doc,
                  usageCount: (doc.usageCount || 0) + 1,
                  updatedAt: new Date()
                }
              : doc
          )
        }));
      },

      getTemplatesByCategory: (category) => {
        const state = get();
        return state.documents.filter(doc => 
          doc.isTemplate === true && doc.category === category
        );
      },

      getPopularTemplates: (limit = 5) => {
        const state = get();
        return state.documents
          .filter(doc => doc.isTemplate === true)
          .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
          .slice(0, limit);
      },

      getFavoriteTemplates: () => {
        const state = get();
        return state.documents.filter(doc => 
          doc.isTemplate === true && doc.isFavorite
        );
      },

      getTemplateStats: () => {
        const state = get();
        const templates = state.documents.filter(doc => doc.isTemplate === true);

        const categoryCounts = templates.reduce((acc, template) => {
          acc[template.category] = (acc[template.category] || 0) + 1;
          return acc;
        }, {} as Record<DocumentCategory, number>);

        return {
          totalTemplates: templates.length,
          builtInCount: templates.filter(t => t.isBuiltIn === true).length,
          userCreatedCount: templates.filter(t => t.isBuiltIn !== true).length,
          favoriteCount: templates.filter(t => t.isFavorite).length,
          totalUsage: templates.reduce((sum, t) => sum + (t.usageCount || 0), 0),
          categoryCounts,
          popularTemplates: templates
            .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
            .slice(0, 5)
        };
      }
    }),
    {
      name: 'from-document-storage',
      partialize: (state) => ({
        documents: state.documents.map(doc => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          lastModifiedAt: doc.lastModifiedAt.toISOString()
        })),
        recentDocuments: state.recentDocuments.map(doc => ({
          ...doc,
          createdAt: doc.createdAt.toISOString(),
          updatedAt: doc.updatedAt.toISOString(),
          lastModifiedAt: doc.lastModifiedAt.toISOString(),
          lastAccessedAt: doc.lastAccessedAt.toISOString()
        })),
        filters: state.filters,
        viewMode: state.viewMode
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects
          state.documents = state.documents.map(doc => ({
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            lastModifiedAt: new Date(doc.lastModifiedAt)
          }));
          
          state.recentDocuments = state.recentDocuments.map(doc => ({
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt),
            lastModifiedAt: new Date(doc.lastModifiedAt),
            lastAccessedAt: new Date(doc.lastAccessedAt)
          }));
        }
      }
    }
  )
);

// Convenience hooks
export const useDocuments = () => useDocumentStore((state) => state.getFilteredDocuments());
export const useDocumentFilters = () => useDocumentStore((state) => state.filters);
export const useDocumentStats = () => useDocumentStore((state) => state.getStats());
export const useRecentDocuments = () => useDocumentStore((state) => state.getRecentDocuments());
export const useDocumentViewMode = () => useDocumentStore((state) => state.viewMode);