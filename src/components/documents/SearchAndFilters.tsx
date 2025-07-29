'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Heart,
  SortAsc,
  SortDesc,
  Star
} from 'lucide-react';
import {
  DocumentFilters,
  DocumentCategory,
  DocumentStatus,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS
} from '@/types/document';
import {
  TemplateFilters,
  TemplateCategory,
  TemplateDifficulty,
  TemplateTone,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_DIFFICULTY_LABELS,
  TEMPLATE_TONE_LABELS
} from '@/types/template';
import { cn } from '@/lib/utils';

interface SearchAndFiltersProps {
  type: 'documents' | 'templates';
  filters: DocumentFilters | TemplateFilters;
  onFiltersChange: (filters: Partial<DocumentFilters | TemplateFilters>) => void;
  onReset?: () => void;
  className?: string;
}

export default function SearchAndFilters({
  type,
  filters,
  onFiltersChange,
  onReset,
  className
}: SearchAndFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false);
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ searchTerm: e.target.value });
  };

  const handleFilterChange = (key: string, value: unknown) => {
    onFiltersChange({ [key]: value });
    setActiveDropdown(null);
  };

  const handleSortOrderToggle = () => {
    const currentOrder = filters.sortOrder;
    onFiltersChange({ sortOrder: currentOrder === 'desc' ? 'asc' : 'desc' });
  };

  const toggleDropdown = (dropdownName: string) => {
    setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
  };

  const getActiveFiltersCount = () => {
    let count = 0;

    if (filters.searchTerm) count++;
    if (type === 'documents') {
      const docFilters = filters as DocumentFilters;
      if (docFilters.category !== 'all') count++;
      if (docFilters.status !== 'all') count++;
      if (docFilters.showFavoritesOnly) count++;
    } else {
      const templateFilters = filters as TemplateFilters;
      if (templateFilters.category !== 'all') count++;
      if (templateFilters.tone !== 'all') count++;
      if (templateFilters.difficulty !== 'all') count++;
      if (templateFilters.showFavoritesOnly) count++;
      if (templateFilters.showBuiltInOnly) count++;
    }

    return count;
  };

  const renderDocumentFilters = () => {
    const docFilters = filters as DocumentFilters;

    return (
      <>
        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('category')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors',
              docFilters.category !== 'all' && 'bg-primary text-primary-foreground'
            )}
          >
            카테고리
            {docFilters.category !== 'all' && (
              <span className="text-xs">({DOCUMENT_CATEGORY_LABELS[docFilters.category as DocumentCategory]})</span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {activeDropdown === 'category' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => handleFilterChange('category', 'all')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                    docFilters.category === 'all' && 'bg-accent'
                  )}
                >
                  전체
                </button>
                {Object.entries(DOCUMENT_CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange('category', key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      docFilters.category === key && 'bg-accent'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('status')}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors',
              docFilters.status !== 'all' && 'bg-primary text-primary-foreground'
            )}
          >
            상태
            {docFilters.status !== 'all' && (
              <span className="text-xs">({DOCUMENT_STATUS_LABELS[docFilters.status as DocumentStatus]})</span>
            )}
            <ChevronDown className="w-4 h-4" />
          </button>

          {activeDropdown === 'status' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                    docFilters.status === 'all' && 'bg-accent'
                  )}
                >
                  전체
                </button>
                {Object.entries(DOCUMENT_STATUS_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange('status', key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      docFilters.status === key && 'bg-accent'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sort By Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('sortBy')}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
          >
            정렬
            <ChevronDown className="w-4 h-4" />
          </button>

          {activeDropdown === 'sortBy' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                {[
                  { key: 'updatedAt', label: '수정일' },
                  { key: 'createdAt', label: '생성일' },
                  { key: 'title', label: '제목' },
                  { key: 'wordCount', label: '글자수' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleFilterChange('sortBy', option.key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      docFilters.sortBy === option.key && 'bg-accent'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Favorites Only */}
        <button
          onClick={() => handleFilterChange('showFavoritesOnly', !docFilters.showFavoritesOnly)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
            docFilters.showFavoritesOnly
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-muted hover:bg-accent'
          )}
        >
          <Heart className={cn('w-4 h-4', docFilters.showFavoritesOnly && 'fill-current')} />
          즐겨찾기만
        </button>
      </>
    );
  };

  const renderTemplateFilters = () => {
    const templateFilters = filters as TemplateFilters;

    return (
      <>
        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('category')}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 text-xs bg-muted hover:bg-accent rounded-md transition-colors w-full justify-between',
              templateFilters.category !== 'all' && 'bg-primary text-primary-foreground'
            )}
          >
            <span className="truncate">
              카테고리
              {templateFilters.category !== 'all' && (
                <span className="ml-1">({TEMPLATE_CATEGORY_LABELS[templateFilters.category as TemplateCategory]})</span>
              )}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          {activeDropdown === 'category' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => handleFilterChange('category', 'all')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                    templateFilters.category === 'all' && 'bg-accent'
                  )}
                >
                  전체
                </button>
                {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange('category', key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      templateFilters.category === key && 'bg-accent'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Tone Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('tone')}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 text-xs bg-muted hover:bg-accent rounded-md transition-colors w-full justify-between',
              templateFilters.tone !== 'all' && 'bg-primary text-primary-foreground'
            )}
          >
            <span className="truncate">
              톤
              {templateFilters.tone !== 'all' && (
                <span className="ml-1">({TEMPLATE_TONE_LABELS[templateFilters.tone as TemplateTone]})</span>
              )}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          {activeDropdown === 'tone' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => handleFilterChange('tone', 'all')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                    templateFilters.tone === 'all' && 'bg-accent'
                  )}
                >
                  전체
                </button>
                {Object.entries(TEMPLATE_TONE_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange('tone', key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      templateFilters.tone === key && 'bg-accent'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('difficulty')}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 text-xs bg-muted hover:bg-accent rounded-md transition-colors w-full justify-between',
              templateFilters.difficulty !== 'all' && 'bg-primary text-primary-foreground'
            )}
          >
            <span className="truncate">
              난이도
              {templateFilters.difficulty !== 'all' && (
                <span className="ml-1">({TEMPLATE_DIFFICULTY_LABELS[templateFilters.difficulty as TemplateDifficulty]})</span>
              )}
            </span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          {activeDropdown === 'difficulty' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                <button
                  onClick={() => handleFilterChange('difficulty', 'all')}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                    templateFilters.difficulty === 'all' && 'bg-accent'
                  )}
                >
                  전체
                </button>
                {Object.entries(TEMPLATE_DIFFICULTY_LABELS).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleFilterChange('difficulty', key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      templateFilters.difficulty === key && 'bg-accent'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sort By Filter */}
        <div className="relative col-span-2">
          <button
            onClick={() => toggleDropdown('sortBy')}
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs bg-muted hover:bg-accent rounded-md transition-colors w-full justify-between"
          >
            <span>정렬</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>

          {activeDropdown === 'sortBy' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-full left-0 mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              <div className="py-1">
                {[
                  { key: 'usageCount', label: '사용횟수' },
                  { key: 'title', label: '제목' },
                  { key: 'createdAt', label: '생성일' },
                  { key: 'category', label: '카테고리' }
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => handleFilterChange('sortBy', option.key)}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm hover:bg-accent',
                      templateFilters.sortBy === option.key && 'bg-accent'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Favorites Only */}
        <button
          onClick={() => handleFilterChange('showFavoritesOnly', !templateFilters.showFavoritesOnly)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors w-full justify-center',
            templateFilters.showFavoritesOnly
              ? 'bg-red-100 text-red-700 hover:bg-red-200'
              : 'bg-muted hover:bg-accent'
          )}
        >
          <Heart className={cn('w-3 h-3', templateFilters.showFavoritesOnly && 'fill-current')} />
          <span className="truncate">즐겨찾기만</span>
        </button>

        {/* Built-in Only */}
        <button
          onClick={() => handleFilterChange('showBuiltInOnly', !templateFilters.showBuiltInOnly)}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md transition-colors w-full justify-center',
            templateFilters.showBuiltInOnly
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-muted hover:bg-accent'
          )}
        >
          <Star className={cn('w-3 h-3', templateFilters.showBuiltInOnly && 'fill-current')} />
          <span className="truncate">공식만</span>
        </button>
      </>
    );
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Compact mode for inline usage
  const isCompact = className?.includes('flex items-center');

  if (isCompact) {
    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors',
            getActiveFiltersCount() > 0 || showFilters
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-accent'
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">필터</span>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-background/20 text-xs px-1 py-0.5 rounded-full min-w-[1rem] text-center">
              {getActiveFiltersCount()}
            </span>
          )}
        </motion.button>

        {/* Compact Filter Dropdown */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute bg-white top-full right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-20 p-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground">필터 옵션</h4>
                {getActiveFiltersCount() > 0 && (
                  <button
                    onClick={onReset}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    초기화
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {type === 'documents' ? renderDocumentFilters() : renderTemplateFilters()}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    );
  }

  // Original full-width layout
  return (
    <div className={cn('space-y-4', className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={type === 'documents' ? '문서 제목이나 내용으로 검색...' : '템플릿 제목이나 설명으로 검색...'}
          value={filters.searchTerm}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        {filters.searchTerm && (
          <button
            onClick={() => onFiltersChange({ searchTerm: '' })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors',
              getActiveFiltersCount() > 0 && 'bg-primary text-primary-foreground'
            )}
          >
            <Filter className="w-4 h-4" />
            필터
            {getActiveFiltersCount() > 0 && (
              <span className="bg-background/20 text-xs px-1.5 py-0.5 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </button>

          {/* Sort Order Toggle */}
          <button
            onClick={handleSortOrderToggle}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
            title={filters.sortOrder === 'desc' ? '내림차순' : '오름차순'}
          >
            {filters.sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4" />
            ) : (
              <SortAsc className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Reset Filters */}
        {getActiveFiltersCount() > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            초기화
          </motion.button>
        )}
      </div>

      {/* Filter Options */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg"
        >
          {type === 'documents' ? renderDocumentFilters() : renderTemplateFilters()}
        </motion.div>
      )}
    </div>
  );
}