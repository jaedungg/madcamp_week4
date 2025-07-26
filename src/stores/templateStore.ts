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
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => Template;
  toggleFavorite: (id: string) => void;
  useTemplate: (id: string) => void; // Increment usage count
  
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

// Built-in Korean templates
const builtInTemplates: Template[] = [
  // Email templates
  {
    id: 'email-business-request',
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
  },
  {
    id: 'email-thank-you',
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
  },
  {
    id: 'email-apology',
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
  },

  // Letter templates
  {
    id: 'letter-family',
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
  },
  {
    id: 'letter-friend',
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
  },

  // Creative writing templates
  {
    id: 'creative-diary',
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
  },
  {
    id: 'creative-goals',
    title: '목표 설정 및 계획',
    description: '장기 목표와 실행 계획을 체계적으로 정리하는 템플릿',
    content: `# [기간] 목표 설정

## 🎯 주요 목표

### 1. [목표 분야 1] 
**목표:** [구체적인 목표]
**기한:** [완료 예정 일자]
**중요도:** ⭐⭐⭐⭐⭐

### 2. [목표 분야 2]
**목표:** [구체적인 목표] 
**기한:** [완료 예정 일자]
**중요도:** ⭐⭐⭐⭐⭐

### 3. [목표 분야 3]
**목표:** [구체적인 목표]
**기한:** [완료 예정 일자] 
**중요도:** ⭐⭐⭐⭐⭐

## 📋 실행 계획

### 단계별 액션 플랜
1. **1단계 ([기간])**
   - [구체적인 행동 1]
   - [구체적인 행동 2]

2. **2단계 ([기간])**
   - [구체적인 행동 1] 
   - [구체적인 행동 2]

3. **3단계 ([기간])**
   - [구체적인 행동 1]
   - [구체적인 행동 2]

## 🔄 점검 일정
- **주간 점검:** [요일]
- **월간 점검:** [날짜]
- **중간 평가:** [날짜]

## 💪 동기부여
**왜 이 목표가 중요한가?**
[목표 달성의 의미와 동기]

**성공했을 때의 모습**
[목표 달성 후 변화된 나의 모습]`,
    preview: '장기 목표와 실행 계획을 체계적으로 정리하는 템플릿',
    category: 'creative',
    tags: ['목표', '계획', '동기부여', '성장'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 43,
    difficulty: 'intermediate',
    estimatedWords: 150,
    tone: 'professional',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  },

  // Business templates
  {
    id: 'business-meeting-minutes',
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

### 2. [안건 2]
**발표자:** [이름]
**주요 내용:**
- [내용 1]
- [내용 2]

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
  },
  {
    id: 'business-proposal',
    title: '제안서 개요',
    description: '아이디어나 프로젝트 제안을 위한 구조화된 제안서 템플릿',
    content: `# [제안서 제목]

## 📖 개요
**제안자:** [이름/팀명]
**제안 일자:** [날짜]
**대상:** [제안 대상]

## 🎯 제안 배경
[왜 이 제안이 필요한지에 대한 배경 설명]

## 💡 제안 내용

### 주요 아이디어
[핵심 아이디어를 간결하게 설명]

### 세부 계획
1. **[단계 1]**
   - [세부 내용]
   - [기대 효과]

2. **[단계 2]**
   - [세부 내용]
   - [기대 효과]

3. **[단계 3]**
   - [세부 내용]
   - [기대 효과]

## 📊 기대 효과
- **정량적 효과:** [수치로 표현 가능한 효과]
- **정성적 효과:** [경험이나 만족도 개선 효과]
- **장기적 효과:** [장기적으로 예상되는 변화]

## 📅 일정 계획
| 단계 | 기간 | 주요 활동 |
|------|------|-----------|
| [단계명] | [기간] | [활동 내용] |
| [단계명] | [기간] | [활동 내용] |

## 💰 예상 비용
- **인력 비용:** [금액]
- **도구/시스템 비용:** [금액]
- **기타 비용:** [금액]
- **총 예상 비용:** [총액]

## 🚨 위험 요소 및 대응 방안
- **위험 요소 1:** [대응 방안]
- **위험 요소 2:** [대응 방안]

## 🔚 결론
[제안의 가치와 도입 필요성을 강조]

---
**문의:** [연락처 정보]`,
    preview: '아이디어나 프로젝트 제안을 위한 구조화된 제안서 템플릿',
    category: 'business',
    tags: ['제안서', '프로젝트', '아이디어', '계획'],
    isFavorite: false,
    isBuiltIn: true,
    usageCount: 29,
    difficulty: 'advanced',
    estimatedWords: 250,
    tone: 'professional',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }
];

// Helper function to generate ID
const generateId = () => `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: builtInTemplates,
      userTemplates: [],
      filters: defaultFilters,
      selectedCategory: 'all',
      selectedTemplates: [],
      isLoading: false,

      // Template management
      createTemplate: (templateData) => {
        const newTemplate: Template = {
          ...templateData,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          isBuiltIn: false
        };

        set((state) => ({
          userTemplates: [newTemplate, ...state.userTemplates]
        }));

        return newTemplate;
      },

      updateTemplate: (id, updates) => {
        set((state) => ({
          templates: state.templates.map(template =>
            template.id === id && !template.isBuiltIn
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          ),
          userTemplates: state.userTemplates.map(template =>
            template.id === id
              ? { ...template, ...updates, updatedAt: new Date() }
              : template
          )
        }));
      },

      deleteTemplate: (id) => {
        set((state) => ({
          templates: state.templates.filter(template => 
            template.id !== id || template.isBuiltIn
          ),
          userTemplates: state.userTemplates.filter(template => template.id !== id),
          selectedTemplates: state.selectedTemplates.filter(templateId => templateId !== id)
        }));
      },

      duplicateTemplate: (id) => {
        const state = get();
        const allTemplates = [...state.templates, ...state.userTemplates];
        const originalTemplate = allTemplates.find(template => template.id === id);
        
        if (!originalTemplate) {
          throw new Error('Template not found');
        }

        const duplicatedTemplate: Template = {
          ...originalTemplate,
          id: generateId(),
          title: `${originalTemplate.title} (복사본)`,
          createdAt: new Date(),
          updatedAt: new Date(),
          usageCount: 0,
          isBuiltIn: false,
          isFavorite: false
        };

        set((state) => ({
          userTemplates: [duplicatedTemplate, ...state.userTemplates]
        }));

        return duplicatedTemplate;
      },

      toggleFavorite: (id) => {
        set((state) => ({
          templates: state.templates.map(template =>
            template.id === id
              ? { ...template, isFavorite: !template.isFavorite }
              : template
          ),
          userTemplates: state.userTemplates.map(template =>
            template.id === id
              ? { ...template, isFavorite: !template.isFavorite }
              : template
          )
        }));
      },

      useTemplate: (id) => {
        set((state) => ({
          templates: state.templates.map(template =>
            template.id === id
              ? { ...template, usageCount: template.usageCount + 1 }
              : template
          ),
          userTemplates: state.userTemplates.map(template =>
            template.id === id
              ? { ...template, usageCount: template.usageCount + 1 }
              : template
          )
        }));
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

      // Data access
      getFilteredTemplates: () => {
        const state = get();
        const { templates, userTemplates, filters } = state;
        let allTemplates = [...templates, ...userTemplates];

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
        const state = get();
        const allTemplates = [...state.templates, ...state.userTemplates];
        return allTemplates.filter(template => template.category === category);
      },

      getPopularTemplates: (limit = 5) => {
        const state = get();
        const allTemplates = [...state.templates, ...state.userTemplates];
        return allTemplates
          .sort((a, b) => b.usageCount - a.usageCount)
          .slice(0, limit);
      },

      getFavoriteTemplates: () => {
        const state = get();
        const allTemplates = [...state.templates, ...state.userTemplates];
        return allTemplates.filter(template => template.isFavorite);
      },

      getStats: () => {
        const state = get();
        const allTemplates = [...state.templates, ...state.userTemplates];

        const categoryCounts = allTemplates.reduce((acc, template) => {
          acc[template.category] = (acc[template.category] || 0) + 1;
          return acc;
        }, {} as Record<TemplateCategory, number>);

        return {
          totalTemplates: allTemplates.length,
          builtInCount: state.templates.length,
          userCreatedCount: state.userTemplates.length,
          favoriteCount: allTemplates.filter(template => template.isFavorite).length,
          totalUsage: allTemplates.reduce((sum, template) => sum + template.usageCount, 0),
          categoryCounts,
          popularTemplates: allTemplates
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5)
        };
      },

      // Data management
      exportTemplates: async () => {
        const state = get();
        const exportData = {
          userTemplates: state.userTemplates,
          exportedAt: new Date().toISOString(),
          version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        });

        return blob;
      },

      importTemplates: (importedTemplates) => {
        set((state) => {
          const existingIds = new Set([
            ...state.templates.map(t => t.id),
            ...state.userTemplates.map(t => t.id)
          ]);
          
          const newTemplates = importedTemplates
            .filter(template => !existingIds.has(template.id))
            .map(template => ({
              ...template,
              isBuiltIn: false,
              createdAt: new Date(template.createdAt),
              updatedAt: new Date(template.updatedAt)
            }));
          
          return {
            userTemplates: [...state.userTemplates, ...newTemplates]
          };
        });
      }
    }),
    {
      name: 'from-template-storage',
      partialize: (state) => ({
        userTemplates: state.userTemplates.map(template => ({
          ...template,
          createdAt: template.createdAt.toISOString(),
          updatedAt: template.updatedAt.toISOString()
        })),
        filters: state.filters,
        selectedCategory: state.selectedCategory,
        // Store favorite status for built-in templates
        builtInFavorites: state.templates
          .filter(t => t.isFavorite)
          .map(t => t.id)
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert date strings back to Date objects for user templates
          state.userTemplates = state.userTemplates.map(template => ({
            ...template,
            createdAt: new Date(template.createdAt),
            updatedAt: new Date(template.updatedAt)
          }));

          // Restore favorite status for built-in templates
          if (state.builtInFavorites) {
            state.templates = builtInTemplates.map(template => ({
              ...template,
              isFavorite: state.builtInFavorites!.includes(template.id)
            }));
          } else {
            state.templates = builtInTemplates;
          }
        }
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