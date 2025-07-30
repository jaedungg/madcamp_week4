import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Template,
  TemplateCategory,
  TemplateDifficulty,
  TemplateTone,
  TemplateFilters,
  TemplateSortBy,
  TemplateStats,
  TemplateSubcategory,
  EMAIL_SUBCATEGORIES
} from '@/types/template';
import { useDocumentStore } from './documentStore';
import { Document, DocumentCategory } from '@/types/document';

interface TemplateState {
  // Template data
  templates: Template[];
  userTemplates: Template[];
  
  // UI state
  filters: TemplateFilters;
  selectedCategory: TemplateCategory | 'all';
  selectedTemplates: string[];
  isLoading: boolean;
  
  // Persistence state
  builtInFavorites?: string[];
  
  // Template management
  createTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'isBuiltIn'>) => Template;
  updateTemplate: (id: string, updates: Partial<Template>) => void;
  deleteTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Template;
  toggleFavorite: (id: string) => void;
  useTemplate: (id: string) => Promise<void>; // Increment usage count
  addTemplateFromAPI: (template: any) => void; // API 응답 데이터를 로컬 스토어에 추가
  
  // Filtering and sorting
  setFilters: (filters: Partial<TemplateFilters>) => void;
  resetFilters: () => void;
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: TemplateCategory | 'all') => void;
  setSortBy: (sortBy: TemplateSortBy) => void;
  
  // Selection
  selectTemplate: (id: string) => void;
  clearSelection: () => void;
  
  // Data access
  getFilteredTemplates: () => Template[];
  getTemplatesByCategory: (category: TemplateCategory) => Template[];
  getPopularTemplates: (limit?: number) => Template[];
  getFavoriteTemplates: () => Template[];
  getStats: () => TemplateStats;
  
  // Data management
  exportTemplates: () => Promise<Blob>;
  importTemplates: (templates: Template[]) => void;
}

// Convert Document to Template
const convertDocumentToTemplate = (doc: Document): Template => {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.excerpt || doc.content.substring(0, 200),
    content: doc.content,
    preview: doc.preview || doc.excerpt,
    category: doc.category as TemplateCategory,
    tags: doc.tags,
    isFavorite: doc.isFavorite,
    isBuiltIn: doc.isBuiltIn || false,
    usageCount: doc.usageCount || 0,
    difficulty: (doc.difficulty as TemplateDifficulty) || 'beginner',
    estimatedWords: doc.estimatedWords || doc.wordCount,
    tone: (doc.tone as TemplateTone) || 'professional',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  };
};

// Default filters
const defaultFilters: TemplateFilters = {
  searchTerm: '',
  category: 'all',
  tone: 'all',
  difficulty: 'all',
  showFavoritesOnly: false,
  showBuiltInOnly: false,
  sortBy: 'usageCount',
  sortOrder: 'desc'
};

// Helper function to get template documents from document store
const getTemplateDocuments = (): Document[] => {
  return useDocumentStore.getState().getTemplateDocuments();
};

// Helper function to convert templates for compatibility
const getTemplatesAsTemplateType = (): Template[] => {
  const templateDocs = getTemplateDocuments();
  return templateDocs.map(convertDocumentToTemplate);
};

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // Initial state - will be populated from documentStore
      templates: [],
      userTemplates: [],
      filters: defaultFilters,
      selectedCategory: 'all',
      selectedTemplates: [],
      isLoading: false,

      // Template management - delegate to documentStore
      createTemplate: (templateData) => {
        const documentStore = useDocumentStore.getState();
        const newDoc = documentStore.createTemplateDocument(
          templateData.title,
          templateData.category as DocumentCategory,
          templateData.difficulty,
          templateData.tone
        );
        
        // Update content and other fields
        documentStore.updateDocument(newDoc.id, {
          content: templateData.content,
          tags: templateData.tags || [],
          preview: templateData.preview || templateData.description
        });

        return convertDocumentToTemplate(newDoc);
      },

      updateTemplate: (id, updates) => {
        const documentStore = useDocumentStore.getState();
        documentStore.updateDocument(id, {
          title: updates.title,
          content: updates.content,
          tags: updates.tags,
          category: updates.category as DocumentCategory,
          difficulty: updates.difficulty,
          tone: updates.tone,
          estimatedWords: updates.estimatedWords,
          preview: updates.preview
        });
      },

      deleteTemplate: async (id: string): Promise<void> => {
        const documentStore = useDocumentStore.getState();
        
        // 삭제하려는 템플릿이 존재하는지 확인
        const originalDoc = documentStore.documents.find(doc => doc.id === id && doc.isTemplate);
        
        if (!originalDoc) {
          throw new Error('삭제하려는 템플릿을 찾을 수 없습니다');
        }

        // 공식 템플릿인지 확인
        if (originalDoc.isBuiltIn) {
          throw new Error('공식 템플릿은 삭제할 수 없습니다');
        }

        // 낙관적 업데이트: 먼저 로컬에서 삭제
        documentStore.deleteDocument(id);
        
        set((state) => ({
          selectedTemplates: state.selectedTemplates.filter(templateId => templateId !== id)
        }));

        try {
          // 백엔드 API 호출
          const response = await fetch(`/api/templates/${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || '템플릿 삭제에 실패했습니다');
          }

        } catch (error) {
          // API 실패 시 롤백: 원래 문서를 복원
          documentStore.importDocuments([originalDoc]);
          
          const errorMessage = error instanceof Error ? error.message : '템플릿 삭제에 실패했습니다';
          throw new Error(errorMessage);
        }
      },

      duplicateTemplate: (id) => {
        const documentStore = useDocumentStore.getState();
        const duplicatedDoc = documentStore.duplicateDocument(id);
        
        // Update title to indicate it's a copy
        documentStore.updateDocument(duplicatedDoc.id, {
          title: `${duplicatedDoc.title} (복사본)`,
          isTemplate: true,
          usageCount: 0,
          isFavorite: false
        });

        return convertDocumentToTemplate(duplicatedDoc);
      },

      toggleFavorite: (id) => {
        const documentStore = useDocumentStore.getState();
        documentStore.toggleFavorite(id);
      },

      useTemplate: async (id: string): Promise<void> => {
        const documentStore = useDocumentStore.getState();
        
        // 템플릿이 존재하는지 확인
        const template = documentStore.documents.find(doc => doc.id === id && doc.isTemplate);
        if (!template) {
          throw new Error('사용하려는 템플릿을 찾을 수 없습니다');
        }

        // 현재 사용 횟수 저장 (롤백용)
        const originalUsageCount = template.usageCount || 0;
        
        // 낙관적 업데이트: 먼저 로컬에서 카운트 증가
        documentStore.useTemplate(id);

        try {
          // 백엔드 API 호출
          const response = await fetch(`/api/templates/${id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'use' }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || '템플릿 사용 횟수 업데이트에 실패했습니다');
          }

          // API에서 반환된 실제 사용 횟수로 동기화
          if (typeof result.usageCount === 'number') {
            documentStore.updateDocument(id, {
              usageCount: result.usageCount
            });
          }

        } catch (error) {
          // API 실패 시 로컬 카운트를 원래 값으로 롤백
          documentStore.updateDocument(id, {
            usageCount: originalUsageCount
          });
          
          // 사용 횟수 업데이트 실패는 사용자 경험을 크게 해치지 않으므로 경고만 출력
          console.warn('템플릿 사용 횟수 동기화에 실패했습니다:', error);
        }
      },

      addTemplateFromAPI: (apiTemplate) => {
        const documentStore = useDocumentStore.getState();
        
        // API 응답 데이터를 Document 형식으로 변환
        const templateDoc = {
          id: apiTemplate.id,
          title: apiTemplate.title,
          content: apiTemplate.content || '',
          excerpt: apiTemplate.preview || apiTemplate.description || '',
          wordCount: apiTemplate.estimated_words || apiTemplate.estimatedWords || 0,
          category: apiTemplate.category as DocumentCategory,
          tags: apiTemplate.tags || [],
          isFavorite: false,
          createdAt: new Date(apiTemplate.created_at || apiTemplate.createdAt || Date.now()),
          updatedAt: new Date(apiTemplate.updated_at || apiTemplate.updatedAt || Date.now()),
          lastModifiedAt: new Date(apiTemplate.updated_at || apiTemplate.updatedAt || Date.now()),
          status: 'completed' as const,
          aiRequestsUsed: 0,
          isTemplate: true,
          difficulty: apiTemplate.difficulty,
          tone: apiTemplate.tone,
          estimatedWords: apiTemplate.estimated_words || apiTemplate.estimatedWords || 0,
          isBuiltIn: apiTemplate.isBuiltIn || false,
          usageCount: 0,
          preview: apiTemplate.preview || apiTemplate.description || ''
        };

        // DocumentStore에 단일 문서로 추가
        documentStore.importDocuments([templateDoc]);
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

      setSelectedCategory: (selectedCategory) => {
        set({ selectedCategory });
      },

      setSortBy: (sortBy) => {
        set((state) => ({
          filters: { ...state.filters, sortBy }
        }));
      },

      // Selection
      selectTemplate: (id) => {
        set((state) => ({
          selectedTemplates: state.selectedTemplates.includes(id)
            ? state.selectedTemplates.filter(templateId => templateId !== id)
            : [...state.selectedTemplates, id]
        }));
      },

      clearSelection: () => {
        set({ selectedTemplates: [] });
      },

      // Data access - delegate to documentStore
      getFilteredTemplates: () => {
        const state = get();
        const { filters } = state;
        const documentStore = useDocumentStore.getState();
        let allTemplates = documentStore.getTemplateDocuments().map(convertDocumentToTemplate);

        // Apply filters
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          allTemplates = allTemplates.filter(template =>
            template.title.toLowerCase().includes(term) ||
            template.description.toLowerCase().includes(term) ||
            template.tags.some(tag => tag.toLowerCase().includes(term))
          );
        }

        if (filters.category !== 'all') {
          allTemplates = allTemplates.filter(template => template.category === filters.category);
        }

        if (filters.tone !== 'all') {
          allTemplates = allTemplates.filter(template => template.tone === filters.tone);
        }

        if (filters.difficulty !== 'all') {
          allTemplates = allTemplates.filter(template => template.difficulty === filters.difficulty);
        }

        if (filters.showFavoritesOnly) {
          allTemplates = allTemplates.filter(template => template.isFavorite);
        }

        if (filters.showBuiltInOnly) {
          allTemplates = allTemplates.filter(template => template.isBuiltIn);
        }

        // Apply sorting
        allTemplates.sort((a, b) => {
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

        return allTemplates;
      },

      getTemplatesByCategory: (category) => {
        const documentStore = useDocumentStore.getState();
        return documentStore.getTemplatesByCategory(category as DocumentCategory)
          .map(convertDocumentToTemplate);
      },

      getPopularTemplates: (limit = 5) => {
        const documentStore = useDocumentStore.getState();
        return documentStore.getPopularTemplates(limit)
          .map(convertDocumentToTemplate);
      },

      getFavoriteTemplates: () => {
        const documentStore = useDocumentStore.getState();
        return documentStore.getFavoriteTemplates()
          .map(convertDocumentToTemplate);
      },

      getStats: () => {
        const documentStore = useDocumentStore.getState();
        const templateStats = documentStore.getTemplateStats();
        
        return {
          totalTemplates: templateStats.totalTemplates,
          builtInCount: templateStats.builtInCount,
          userCreatedCount: templateStats.userCreatedCount,
          favoriteCount: templateStats.favoriteCount,
          totalUsage: templateStats.totalUsage,
          categoryCounts: templateStats.categoryCounts as Record<TemplateCategory, number>,
          popularTemplates: templateStats.popularTemplates.map(convertDocumentToTemplate)
        };
      },

      // Data management
      exportTemplates: async () => {
        const documentStore = useDocumentStore.getState();
        const userTemplates = documentStore.getTemplateDocuments()
          .filter(doc => !doc.isBuiltIn)
          .map(convertDocumentToTemplate);
          
        const exportData = {
          userTemplates,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });

        return blob;
      },

      importTemplates: (importedTemplates) => {
        const documentStore = useDocumentStore.getState();
        
        // Convert templates to documents and import them
        const templateDocs = importedTemplates.map(template => ({
          id: template.id,
          title: template.title,
          content: template.content,
          excerpt: template.preview || template.description,
          wordCount: template.estimatedWords,
          category: template.category as DocumentCategory,
          tags: template.tags,
          isFavorite: template.isFavorite,
          createdAt: template.createdAt,
          updatedAt: template.updatedAt,
          lastModifiedAt: template.updatedAt,
          status: 'completed' as const,
          aiRequestsUsed: 0,
          isTemplate: true,
          difficulty: template.difficulty,
          tone: template.tone,
          estimatedWords: template.estimatedWords,
          isBuiltIn: false,
          usageCount: template.usageCount,
          preview: template.preview
        }));

        documentStore.importDocuments(templateDocs);
      }
    }),
    {
      name: 'from-template-storage',
      partialize: (state) => ({
        filters: state.filters,
        selectedCategory: state.selectedCategory
      }),
      onRehydrateStorage: () => (state) => {
        // No need to restore templates since they come from documentStore
        return state;
      }
    }
  )
);

// Convenience hooks
export const useTemplates = () => useTemplateStore((state) => state.getFilteredTemplates());
export const useTemplateFilters = () => useTemplateStore((state) => state.filters);
export const useTemplateStats = () => useTemplateStore((state) => state.getStats());
export const usePopularTemplates = () => useTemplateStore((state) => state.getPopularTemplates());
export const useFavoriteTemplates = () => useTemplateStore((state) => state.getFavoriteTemplates());
export const useTemplatesByCategory = (category: TemplateCategory) => 
  useTemplateStore((state) => state.getTemplatesByCategory(category));