'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookTemplate,
  Plus,
  Star,
  TrendingUp,
  Download,
  Upload,
  Sparkles,
  Mail,
  MessageSquare,
  PenTool,
  Briefcase,
  Users,
  GraduationCap,
  Search,
  X
} from 'lucide-react';
import { useTemplateStore } from '@/stores/templateStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUserStore } from '@/stores/userStore';
import { Template, TemplateCategory, TEMPLATE_CATEGORY_LABELS, TemplateFilters } from '@/types/template';
import { DocumentFilters } from '@/types/document';
import TemplateCard from '@/components/documents/TemplateCard';
import SearchAndFilters from '@/components/documents/SearchAndFilters';
import EmptyState from '@/components/documents/EmptyState';
import CreateTemplateModal from '@/components/templates/CreateTemplateModal';
import EditTemplateModal from '@/components/templates/EditTemplateModal';
import { cn } from '@/lib/utils';

const categoryIcons: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  letter: MessageSquare,
  creative: PenTool,
  business: Briefcase,
  social: Users,
  academic: GraduationCap,
  marketing: TrendingUp
};

export default function TemplatesPage() {
  const {
    filters,
    selectedCategory,
    setFilters,
    resetFilters,
    setSelectedCategory,
    getFilteredTemplates,
    getTemplatesByCategory,
    getPopularTemplates,
    getFavoriteTemplates,
    getStats,
    duplicateTemplate,
    deleteTemplate,
    exportTemplates,
    importTemplates
  } = useTemplateStore();
  const { incrementDocumentCount } = useUserStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string>('');

  // 페이지 로드 시 서버에서 템플릿 데이터 동기화
  useEffect(() => {
    const syncTemplateData = async () => {
      setIsLoadingTemplates(true);
      try {
        const response = await fetch('/api/templates'); // Built-in templates included by default
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.templates) {
            // 서버에서 받은 템플릿 데이터를 로컬 스토어에 동기화
            const templateStore = useTemplateStore.getState();
            result.templates.forEach((template: any) => {
              templateStore.addTemplateFromAPI(template);
            });
          }
        }
      } catch (error) {
        console.error('템플릿 데이터 동기화 실패:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    syncTemplateData();
  }, []);

  const templates = getFilteredTemplates();
  const popularTemplates = getPopularTemplates(6);
  const favoriteTemplates = getFavoriteTemplates();
  const stats = getStats();

  const handleUseTemplate = async (template: Template) => {
    try {
      // Track template usage (백엔드와 동기화됨)
      const templateStore = useTemplateStore.getState();
      await templateStore.useTemplate(template.id);

      // Increment user document count
      incrementDocumentCount();

      // Clean up the title and set as draft
      const cleanTitle = template.title
        .replace(/\s*템플릿\s*$/i, '')
        .replace(/\s*\(복사본\)\s*$/i, '')
        .trim() || '새 문서';

      // Create document in database via API
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: cleanTitle,
          content: template.content,
          category: template.category,
          tags: template.tags || [],
        }),
      });

      if (!response.ok) {
        throw new Error('문서 생성에 실패했습니다.');
      }

      const result = await response.json();

      if (!result.success || !result.document) {
        throw new Error('문서 생성 응답이 올바르지 않습니다.');
      }

      // Navigate to editor with the new document
      if (typeof window !== 'undefined') {
        window.location.href = `/editor?id=${result.document.id}`;
      }
    } catch (error) {
      console.error('템플릿 사용 중 오류가 발생했습니다:', error);
      // You might want to show a toast notification here in the future
    }
  };

  const handleDuplicateTemplate = (template: Template) => {
    try {
      const duplicatedTemplate = duplicateTemplate(template.id);
      console.log('템플릿이 복사되었습니다:', duplicatedTemplate.title);
    } catch (error) {
      console.error('템플릿 복사 실패:', error);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowEditModal(true);
  };

  const handleDeleteTemplate = (template: Template) => {
    if (template.isBuiltIn) {
      console.log('공식 템플릿은 삭제할 수 없습니다.');
      return;
    }
    setShowDeleteConfirm(template.id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await deleteTemplate(showDeleteConfirm);
      setShowDeleteConfirm(null);
      console.log('템플릿이 성공적으로 삭제되었습니다');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '템플릿 삭제에 실패했습니다';
      setDeleteError(errorMessage);
      console.error('템플릿 삭제 실패:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportTemplates = async () => {
    try {
      const blob = await exportTemplates();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `templates-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('템플릿 내보내기 실패:', error);
    }
  };

  const handleImportTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.userTemplates && Array.isArray(data.userTemplates)) {
          importTemplates(data.userTemplates);
          console.log('템플릿을 성공적으로 가져왔습니다.');
        } else {
          console.error('올바르지 않은 파일 형식입니다.');
        }
      } catch (error) {
        console.error('파일 읽기 실패:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const getEmptyStateType = () => {
    if (filters.searchTerm) return 'search';
    if (filters.showFavoritesOnly) return 'favorites';
    if (filters.category !== 'all' || filters.tone !== 'all' || filters.difficulty !== 'all') return 'filter';
    return 'templates';
  };

  const handleEmptyStateAction = () => {
    const emptyType = getEmptyStateType();

    switch (emptyType) {
      case 'search':
        setFilters({ searchTerm: '' });
        break;
      case 'filter':
      case 'favorites':
        resetFilters();
        break;
      case 'templates':
      default:
        setShowCreateModal(true);
        break;
    }
  };

  const handleCreateSuccess = (template: Template) => {
    console.log('새 템플릿이 생성되었습니다:', template.title);
    // 템플릿 스토어가 자동으로 업데이트됩니다
  };

  const handleEditSuccess = (template: Template) => {
    console.log('템플릿이 수정되었습니다:', template.title);
    setShowEditModal(false);
    setEditingTemplate(null);
    // 템플릿 스토어가 자동으로 업데이트됩니다
  };

  const categories = Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => ({
    key: key as TemplateCategory,
    label,
    icon: categoryIcons[key as TemplateCategory],
    count: getTemplatesByCategory(key as TemplateCategory).length
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <BookTemplate className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              템플릿
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              다양한 상황에 맞는 템플릿으로 글쓰기를 시작해보세요
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Import/Export */}
            <div className="hidden sm:flex items-center gap-1.5">
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplates}
                className="hidden"
                id="import-templates"
              />
              <motion.label
                htmlFor="import-templates"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-muted hover:bg-accent rounded-md transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                가져오기
              </motion.label>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportTemplates}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-muted hover:bg-accent rounded-md transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                내보내기
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors font-medium text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">새 템플릿</span>
              <span className="sm:hidden">새로만들기</span>
            </motion.button>
          </div>
        </div>

        {/* Stats - Responsive Compact Version */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 p-2.5 sm:p-3 rounded-lg border border-purple-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-500 rounded-md flex items-center justify-center flex-shrink-0">
                <BookTemplate className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-purple-700 truncate">전체 템플릿</p>
                <p className="text-base sm:text-lg font-bold text-purple-900">{stats.totalTemplates}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-2.5 sm:p-3 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 rounded-md flex items-center justify-center flex-shrink-0">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-blue-700 truncate">공식 템플릿</p>
                <p className="text-base sm:text-lg font-bold text-blue-900">{stats.builtInCount}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-50 to-green-100 p-2.5 sm:p-3 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-500 rounded-md flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-green-700 truncate">총 사용횟수</p>
                <p className="text-base sm:text-lg font-bold text-green-900">{stats.totalUsage}회</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-red-50 to-red-100 p-2.5 sm:p-3 rounded-lg border border-red-200"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-500 rounded-md flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-red-700 truncate">즐겨찾기</p>
                <p className="text-base sm:text-lg font-bold text-red-900">{stats.favoriteCount}개</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Categories - Compact Version */}
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            카테고리
          </h3>
          <div className="flex flex-wrap gap-1.5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent text-muted-foreground'
              )}
            >
              전체
              <span className="text-xs bg-background/20 px-1 py-0.5 rounded">
                {stats.totalTemplates}
              </span>
            </motion.button>

            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.key}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(category.key)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors',
                    selectedCategory === category.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {category.label}
                  <span className="text-xs bg-background/20 px-1 py-0.5 rounded">
                    {category.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto relative">
        {/* Filters and Search - Sticky Top Bar */}
        <div className="sticky top-0 z-10 bg-background/98 backdrop-blur-md border-b border-border shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="flex-1 max-w-sm relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="템플릿 검색..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ searchTerm: e.target.value })}
                  className="w-full pl-10 pr-8 py-2 bg-muted/50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-background transition-all text-sm"
                />
                {filters.searchTerm && (
                  <button
                    onClick={() => setFilters({ searchTerm: '' })}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-background rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Quick Filters */}
              <div className="flex items-center gap-1.5">
                {/* Favorites Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilters({ showFavoritesOnly: !filters.showFavoritesOnly })}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-all',
                    filters.showFavoritesOnly
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 shadow-sm'
                      : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  title="즐겨찾기만 보기"
                >
                  <Star className={cn('w-4 h-4', filters.showFavoritesOnly && 'fill-current')} />
                  <span className="hidden md:inline text-xs">즐겨찾기</span>
                </motion.button>

                {/* Sort Toggle */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilters({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-all"
                  title={filters.sortOrder === 'desc' ? '내림차순' : '오름차순'}
                >
                  {filters.sortOrder === 'desc' ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingUp className="w-4 h-4 rotate-180" />
                  )}
                  <span className="hidden md:inline text-xs">정렬</span>
                </motion.button>

                {/* Advanced Filters */}
                <SearchAndFilters
                  type="templates"
                  filters={filters}
                  onFiltersChange={setFilters as (filters: Partial<TemplateFilters | DocumentFilters>) => void}
                  onReset={resetFilters}
                  className="flex items-center"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Popular Templates Section */}
        {selectedCategory === 'all' && !filters.searchTerm && popularTemplates.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                인기 템플릿
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {popularTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TemplateCard
                    template={template}
                    onUse={handleUseTemplate}
                    onEdit={handleEditTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Favorite Templates Section */}
        {selectedCategory === 'all' && !filters.searchTerm && favoriteTemplates.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                즐겨찾기 템플릿
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {favoriteTemplates.slice(0, 8).map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TemplateCard
                    template={template}
                    onUse={handleUseTemplate}
                    onEdit={handleEditTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div className="p-4">
          {templates.length === 0 ? (
            <EmptyState
              type={getEmptyStateType()}
              onAction={handleEmptyStateAction}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedCategory === 'all' ? '모든 템플릿' : TEMPLATE_CATEGORY_LABELS[selectedCategory]}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {templates.length}개 템플릿
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {templates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TemplateCard
                      template={template}
                      onUse={handleUseTemplate}
                      onEdit={handleEditTemplate}
                      onDuplicate={handleDuplicateTemplate}
                      onDelete={handleDeleteTemplate}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card bg-white p-6 rounded-lg shadow-lg max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              템플릿 삭제
            </h3>
            <p className="text-muted-foreground mb-6">
              이 템플릿을 삭제하시겠습니까? 삭제된 템플릿은 복구할 수 없습니다.
            </p>
            
            {/* 에러 메시지 표시 */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white border-solid rounded-full animate-spin"></div>
                    삭제 중...
                  </>
                ) : (
                  '삭제'
                )}
              </button>
            </div>
          </motion.div>

        </div>
      )}

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Template Modal */}
      <EditTemplateModal
        isOpen={showEditModal}
        template={editingTemplate}
        onClose={() => {
          setShowEditModal(false);
          setEditingTemplate(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}