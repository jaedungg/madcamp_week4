'use client';

import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { useTemplateStore } from '@/stores/templateStore';
import { useDocumentStore } from '@/stores/documentStore';
import { useUserStore } from '@/stores/userStore';
import { Template, TemplateCategory, TEMPLATE_CATEGORY_LABELS, TemplateFilters } from '@/types/template';
import { DocumentCategory, DocumentFilters } from '@/types/document';
import TemplateCard from '@/components/documents/TemplateCard';
import SearchAndFilters from '@/components/documents/SearchAndFilters';
import EmptyState from '@/components/documents/EmptyState';
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
    importTemplates,
    useTemplate
  } = useTemplateStore();

  const { createDocument } = useDocumentStore();
  const { incrementDocumentCount } = useUserStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const templates = getFilteredTemplates();
  const popularTemplates = getPopularTemplates(6);
  const favoriteTemplates = getFavoriteTemplates();
  const stats = getStats();

  const handleUseTemplate = (template: Template) => {
    // Track template usage
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useTemplate(template.id);
    
    // Create new document with template content
    const newDoc = createDocument(template.title, template.category as DocumentCategory);
    incrementDocumentCount();
    
    // Navigate to editor with template content
    const params = new URLSearchParams({
      id: newDoc.id,
      templateContent: template.content
    });
    window.location.href = `/editor?${params.toString()}`;
  };

  const handleDuplicateTemplate = (template: Template) => {
    try {
      const duplicatedTemplate = duplicateTemplate(template.id);
      console.log('템플릿이 복사되었습니다:', duplicatedTemplate.title);
    } catch (error) {
      console.error('템플릿 복사 실패:', error);
    }
  };

  const handleDeleteTemplate = (template: Template) => {
    if (template.isBuiltIn) {
      console.log('공식 템플릿은 삭제할 수 없습니다.');
      return;
    }
    setShowDeleteConfirm(template.id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteTemplate(showDeleteConfirm);
      setShowDeleteConfirm(null);
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

  const categories = Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => ({
    key: key as TemplateCategory,
    label,
    icon: categoryIcons[key as TemplateCategory],
    count: getTemplatesByCategory(key as TemplateCategory).length
  }));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <BookTemplate className="w-7 h-7 text-primary" />
              템플릿
            </h1>
            <p className="text-muted-foreground">
              다양한 상황에 맞는 템플릿으로 글쓰기를 시작해보세요
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Import/Export */}
            <div className="flex items-center gap-2">
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
                className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                가져오기
              </motion.label>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExportTemplates}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                내보내기
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              새 템플릿
            </motion.button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <BookTemplate className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">전체 템플릿</p>
                <p className="text-xl font-bold text-purple-900">{stats.totalTemplates}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">공식 템플릿</p>
                <p className="text-xl font-bold text-blue-900">{stats.builtInCount}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">총 사용횟수</p>
                <p className="text-xl font-bold text-green-900">{stats.totalUsage}회</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg border border-red-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-red-700">즐겨찾기</p>
                <p className="text-xl font-bold text-red-900">{stats.favoriteCount}개</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            카테고리
          </h3>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory('all')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-accent text-muted-foreground'
              )}
            >
              전체
              <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded">
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
                    'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                    selectedCategory === category.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-accent text-muted-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {category.label}
                  <span className="text-xs bg-background/20 px-1.5 py-0.5 rounded">
                    {category.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <SearchAndFilters
          type="templates"
          filters={filters}
          onFiltersChange={setFilters as (filters: Partial<TemplateFilters | DocumentFilters>) => void}
          onReset={resetFilters}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Popular Templates Section */}
        {selectedCategory === 'all' && !filters.searchTerm && popularTemplates.length > 0 && (
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                인기 템플릿
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                즐겨찾기 템플릿
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteTemplates.slice(0, 6).map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <TemplateCard
                    template={template}
                    onUse={handleUseTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div className="p-6">
          {templates.length === 0 ? (
            <EmptyState
              type={getEmptyStateType()}
              onAction={handleEmptyStateAction}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedCategory === 'all' ? '모든 템플릿' : TEMPLATE_CATEGORY_LABELS[selectedCategory]}
                </h2>
                <div className="text-sm text-muted-foreground">
                  {templates.length}개 템플릿
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            className="bg-card p-6 rounded-lg shadow-lg max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              템플릿 삭제
            </h3>
            <p className="text-muted-foreground mb-6">
              이 템플릿을 삭제하시겠습니까? 삭제된 템플릿은 복구할 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Template Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-6 rounded-lg shadow-lg max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              새 템플릿 만들기
            </h3>
            <p className="text-muted-foreground mb-6">
              템플릿 생성 기능은 추후 업데이트에서 제공될 예정입니다.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
              >
                확인
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}