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
import { Template, TemplateDifficulty as OldTemplateDifficulty, TemplateTone as OldTemplateTone } from '@/types/template';

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

// Convert Template to Document
const convertTemplateToDocument = (template: Template): Document => {
  return {
    id: template.id,
    title: template.title,
    content: template.content,
    excerpt: template.preview || generateExcerpt(template.content),
    wordCount: template.estimatedWords || countWords(template.content),
    category: template.category as DocumentCategory,
    tags: template.tags,
    isFavorite: template.isFavorite,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    lastModifiedAt: template.updatedAt,
    status: 'completed' as DocumentStatus,
    aiRequestsUsed: 0,
    // Template-specific fields
    isTemplate: true,
    difficulty: template.difficulty as DocumentDifficulty,
    tone: template.tone as DocumentTone,
    estimatedWords: template.estimatedWords,
    isBuiltIn: template.isBuiltIn,
    usageCount: template.usageCount,
    preview: template.preview
  };
};

// Built-in Korean templates (migrated from templateStore)
const builtInTemplateDocuments: Document[] = [
  // Email templates
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: '업무 협조 요청 이메일',
    description: '동료나 다른 부서에 업무 협조를 요청할 때 사용하는 공식적인 이메일 템플릿',
    content: `제목: [프로젝트명] 관련 업무 협조 요청

안녕하세요, [받는 분 이름]님.

[보내는 사람 이름]입니다.

[프로젝트명/업무명] 관련하여 협조를 요청드리고자 연락드립니다.

**요청 사항:**
- [구체적인 요청 내용 1]
- [구체적인 요청 내용 2]
- [구체적인 요청 내용 3]

**일정:** [희망 완료 일정]
**담당자:** [담당자 정보]

바쁘신 중에도 협조해 주시면 대단히 감사하겠습니다.
추가 문의사항이 있으시면 언제든 연락 주세요.

감사합니다.

[보내는 사람 이름]
[부서명/직책]
[연락처]`,
    preview: '동료나 다른 부서에 업무 협조를 요청할 때 사용하는 공식적인 이메일',
    category: 'email',
    tags: ['업무', '협조', '요청', '공식'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 45,
    difficulty: 'beginner',
    estimatedWords: 120,
    tone: 'professional',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }),
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: '감사 인사 이메일',
    description: '도움을 받았거나 협조해 준 상대방에게 감사를 표현하는 이메일',
    content: `제목: [사안] 관련 감사 인사

안녕하세요, [받는 분 이름]님.

[보내는 사람 이름]입니다.

[구체적인 도움을 받은 내용]에 대해 진심으로 감사드립니다.

덕분에 [결과/성과]를 달성할 수 있었습니다. 
특히 [구체적으로 도움이 된 부분]이 큰 도움이 되었습니다.

앞으로도 좋은 관계를 유지하며 함께 성장해 나갔으면 좋겠습니다.

다시 한 번 감사드리며, 좋은 하루 보내세요.

감사합니다.

[보내는 사람 이름]
[부서명/직책]
[연락처]`,
    preview: '도움을 받았거나 협조해 준 상대방에게 감사를 표현하는 이메일',
    category: 'email',
    tags: ['감사', '인사', '협조'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 38,
    difficulty: 'beginner',
    estimatedWords: 90,
    tone: 'friendly',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }),
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: '사과 메시지',
    description: '실수나 문제 상황에 대해 진심으로 사과하는 이메일',
    content: `제목: [사안] 관련 사과 말씀

안녕하세요, [받는 분 이름]님.

[보내는 사람 이름]입니다.

[구체적인 문제 상황]으로 인해 불편을 드린 점 진심으로 사과드립니다.

**문제 상황:**
[발생한 문제에 대한 구체적인 설명]

**원인:**
[문제가 발생한 원인]

**해결 방안:**
- [즉시 조치 사항]
- [향후 예방 대책]
- [보상 방안 (필요시)]

이러한 일이 재발하지 않도록 [구체적인 예방 조치]를 취하겠습니다.

다시 한 번 깊이 사과드리며, 앞으로 더욱 신중하게 업무에 임하겠습니다.

감사합니다.

[보내는 사람 이름]
[부서명/직책]
[연락처]`,
    preview: '실수나 문제 상황에 대해 진심으로 사과하는 이메일',
    category: 'email',
    tags: ['사과', '실수', '해결방안'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 22,
    difficulty: 'intermediate',
    estimatedWords: 130,
    tone: 'formal',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }),
  // Letter templates
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: '가족에게 보내는 편지',
    description: '멀리 있는 가족에게 안부와 근황을 전하는 따뜻한 편지',
    content: `사랑하는 [가족 호칭]께

안녕하세요? 오랜만에 편지를 씁니다.

여기는 [현재 상황/계절 묘사]입니다. 
[가족분]은 어떻게 지내고 계신가요?

요즘 저는 [근황 1]을 하며 지내고 있습니다.
[근황 2]도 잘 되어가고 있어서 다행입니다.

[구체적인 경험이나 에피소드]

항상 건강하시고, [특별한 당부나 걱정사항] 조심하세요.
곧 시간 내서 [만날 계획이나 연락 약속]하겠습니다.

[가족분]이 보고 싶습니다.
사랑합니다.

[날짜]
[보내는 사람] 올림`,
    preview: '멀리 있는 가족에게 안부와 근황을 전하는 따뜻한 편지',
    category: 'letter',
    tags: ['가족', '안부', '근황', '사랑'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 31,
    difficulty: 'beginner',
    estimatedWords: 100,
    tone: 'friendly',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }),
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: '친구에게 보내는 편지',
    description: '오랜 친구에게 추억을 되새기며 보내는 편지',
    content: `안녕, [친구 이름]!

정말 오랜만이다. 요즘 어떻게 지내?

나는 [근황]하며 지내고 있어. 
바쁘긴 하지만 [긍정적인 면]해서 나름 만족스러워.

갑자기 [추억/에피소드]가 생각나더라. 
그때 우리가 [구체적인 추억 내용]했던 게 벌써 [시간]이나 됐다니, 시간 참 빠르다.

요즘 [친구와 관련된 궁금증이나 관심사]는 어떻게 되어 가는지 궁금해.
나중에 시간 날 때 [만날 제안이나 연락 제안]하자.

오늘은 [특별한 이유나 계기]로 편지를 쓰게 되었는데,
정말 [친구에 대한 감정이나 생각]해.

건강하게 지내고, 좋은 일만 가득하길 바라!

[날짜]
[보내는 사람] 올림

P.S. [추신이나 특별한 메시지]`,
    preview: '오랜 친구에게 추억을 되새기며 보내는 편지',
    category: 'letter',
    tags: ['친구', '추억', '안부', '우정'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 26,
    difficulty: 'beginner',
    estimatedWords: 120,
    tone: 'casual',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }),
  // Creative writing templates
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: '일기 쓰기',
    description: '하루를 돌아보며 감정과 생각을 정리하는 일기',
    content: `[날짜] [요일] [날씨]

오늘의 기분: [이모지나 단어로 표현]

**오늘 있었던 일**
[시간순으로 주요 사건들]
- 오전: [활동이나 사건]
- 오후: [활동이나 사건]  
- 저녁: [활동이나 사건]

**인상 깊었던 일**
[구체적인 경험과 그때의 감정]

**오늘의 감사**
- [감사한 일 1]
- [감사한 일 2]
- [감사한 일 3]

**내일 계획**
[내일 하고 싶은 일이나 목표]

**한 줄 정리**
[오늘 하루를 한 줄로 정리]

좋은 꿈 꾸자! 🌙`,
    preview: '하루를 돌아보며 감정과 생각을 정리하는 일기',
    category: 'creative',
    tags: ['일기', '감정', '하루정리', '감사'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 67,
    difficulty: 'beginner',
    estimatedWords: 80,
    tone: 'casual',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }),
  convertTemplateToDocument({
    id: '550e8400-e29b-41d4-a716-446655440007',
    title: '회의록 작성',
    description: '회의 내용과 결정사항을 체계적으로 정리하는 회의록',
    content: `# [회의명] 회의록

**일시:** [날짜] [시간]
**장소:** [회의 장소/온라인 플랫폼]
**참석자:** [참석자 명단]
**작성자:** [회의록 작성자]

## 📋 안건

### 1. [안건 1]
**발표자:** [이름]
**주요 내용:**
- [내용 1]
- [내용 2]
- [내용 3]

**논의사항:**
- [논의 포인트 1]
- [논의 포인트 2]

**결정사항:**
- [결정 내용]
- **담당자:** [이름]
- **완료 기한:** [날짜]

## ✅ Action Items

| 담당자 | 업무 내용 | 완료 기한 | 상태 |
|--------|-----------|-----------|------|
| [이름] | [업무 내용] | [날짜] | [ ] |
| [이름] | [업무 내용] | [날짜] | [ ] |

## 📅 다음 회의
**일시:** [다음 회의 예정 일시]
**안건:** [다음 회의 주요 안건]

---
**회의록 승인:** [승인자 이름] ([날짜])`,
    preview: '회의 내용과 결정사항을 체계적으로 정리하는 회의록',
    category: 'business',
    tags: ['회의록', '업무', '결정사항', '액션아이템'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 52,
    difficulty: 'intermediate',
    estimatedWords: 200,
    tone: 'professional',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  })
];

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
      documents: [...sampleDocuments, ...builtInTemplateDocuments],
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