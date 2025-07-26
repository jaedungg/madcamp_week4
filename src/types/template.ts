export interface Template {
  id: string;
  title: string;
  description: string;
  content: string;
  preview: string; // Shortened preview text
  category: TemplateCategory;
  tags: string[];
  isFavorite: boolean;
  isBuiltIn: boolean; // Built-in vs user-created templates
  usageCount: number; // How many times used
  difficulty: TemplateDifficulty;
  estimatedWords: number;
  tone: TemplateTone;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory = 
  | 'email' 
  | 'letter' 
  | 'creative' 
  | 'business' 
  | 'social' 
  | 'academic'
  | 'marketing';

export type TemplateDifficulty = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced';

export type TemplateTone = 
  | 'formal' 
  | 'professional' 
  | 'friendly' 
  | 'casual' 
  | 'creative';

export interface TemplateFilters {
  searchTerm: string;
  category: TemplateCategory | 'all';
  tone: TemplateTone | 'all';
  difficulty: TemplateDifficulty | 'all';
  showFavoritesOnly: boolean;
  showBuiltInOnly: boolean;
  sortBy: TemplateSortBy;
  sortOrder: 'asc' | 'desc';
}

export type TemplateSortBy = 
  | 'title' 
  | 'usageCount' 
  | 'createdAt' 
  | 'category';

export interface TemplateStats {
  totalTemplates: number;
  builtInCount: number;
  userCreatedCount: number;
  favoriteCount: number;
  totalUsage: number;
  categoryCounts: Record<TemplateCategory, number>;
  popularTemplates: Template[];
}

// Korean labels
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  email: '이메일',
  letter: '편지',
  creative: '창작글',
  business: '업무용',
  social: '소셜',
  academic: '학술',
  marketing: '마케팅'
};

export const TEMPLATE_DIFFICULTY_LABELS: Record<TemplateDifficulty, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급'
};

export const TEMPLATE_TONE_LABELS: Record<TemplateTone, string> = {
  formal: '격식체',
  professional: '전문적',
  friendly: '친근한',
  casual: '캐주얼',
  creative: '창의적'
};

// Template subcategories for better organization
export interface TemplateSubcategory {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  templates: Template[];
}

export const EMAIL_SUBCATEGORIES: TemplateSubcategory[] = [
  {
    id: 'business-email',
    name: '업무 이메일',
    description: '비즈니스 커뮤니케이션을 위한 공식적인 이메일',
    category: 'email',
    icon: 'briefcase',
    templates: []
  },
  {
    id: 'thank-you',
    name: '감사 인사',
    description: '감사의 마음을 전하는 이메일',
    category: 'email',
    icon: 'heart',
    templates: []
  },
  {
    id: 'apology',
    name: '사과 메시지',
    description: '진심어린 사과를 전하는 이메일',
    category: 'email',
    icon: 'alert-circle',
    templates: []
  }
];