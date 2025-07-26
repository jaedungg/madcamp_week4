'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, Trash2 } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUserStore } from '@/stores/userStore';
import { Document } from '@/types/document';
import { TemplateFilters } from '@/types/template';
import { DocumentFilters } from '@/types/document';
import DocumentCard from '@/components/documents/DocumentCard';
import SearchAndFilters from '@/components/documents/SearchAndFilters';
import ViewToggle from '@/components/documents/ViewToggle';
import EmptyState from '@/components/documents/EmptyState';
import { cn } from '@/lib/utils';

export default function DocumentsPage() {
  const {
    filters,
    viewMode,
    selectedDocuments,
    setFilters,
    resetFilters,
    setViewMode,
    getFilteredDocuments,
    createDocument,
    duplicateDocument,
    deleteDocument,
    selectDocument,
    clearSelection,
    deleteSelected,
    exportDocuments,
    importDocuments,
    getStats
  } = useDocumentStore();

  const { incrementDocumentCount } = useUserStore();
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const documents = getFilteredDocuments();
  const stats = getStats();

  const handleCreateDocument = () => {
    const newDoc = createDocument();
    incrementDocumentCount();
    // Navigate to editor
    window.location.href = `/editor?id=${newDoc.id}`;
  };

  const handleEditDocument = (document: Document) => {
    window.location.href = `/editor?id=${document.id}`;
  };

  const handleDuplicateDocument = (document: Document) => {
    try {
      const duplicatedDoc = duplicateDocument(document.id);
      incrementDocumentCount();
      // Show success feedback (you could add a toast notification here)
      console.log('문서가 복사되었습니다:', duplicatedDoc.title);
    } catch (error) {
      console.error('문서 복사 실패:', error);
    }
  };

  const handleDeleteDocument = (document: Document) => {
    setShowDeleteConfirm(document.id);
  };

  const confirmDelete = () => {
    if (showDeleteConfirm) {
      deleteDocument(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    deleteSelected();
    setShowBulkDeleteConfirm(false);
  };

  const handleExportDocuments = async () => {
    try {
      const blob = await exportDocuments();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `documents-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('문서 내보내기 실패:', error);
    }
  };

  const handleImportDocuments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.documents && Array.isArray(data.documents)) {
          importDocuments(data.documents);
          console.log('문서를 성공적으로 가져왔습니다.');
        } else {
          console.error('올바르지 않은 파일 형식입니다.');
        }
      } catch (error) {
        console.error('파일 읽기 실패:', error);
      }
    };
    reader.readAsText(file);
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const getEmptyStateType = () => {
    if (filters.searchTerm) return 'search';
    if (filters.showFavoritesOnly) return 'favorites';
    if (filters.category !== 'all' || filters.status !== 'all') return 'filter';
    return 'documents';
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
      case 'documents':
      default:
        handleCreateDocument();
        break;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">모든 문서</h1>
            <p className="text-muted-foreground">
              총 {stats.totalDocuments}개의 문서 • {stats.totalWords.toLocaleString()}자
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Bulk Actions */}
            {selectedDocuments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 mr-3"
              >
                <span className="text-sm text-muted-foreground">
                  {selectedDocuments.length}개 선택됨
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  삭제
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearSelection}
                  className="px-3 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  선택 해제
                </motion.button>
              </motion.div>
            )}

            {/* Import/Export */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportDocuments}
                className="hidden"
                id="import-documents"
              />
              <motion.label
                htmlFor="import-documents"
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
                onClick={handleExportDocuments}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                내보내기
              </motion.button>
            </div>

            {/* Create Document Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCreateDocument}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              새 문서
            </motion.button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <SearchAndFilters
              type="documents"
              filters={filters}
              onFiltersChange={setFilters as (filters: Partial<TemplateFilters | DocumentFilters>) => void}
              onReset={resetFilters}
            />
          </div>
          
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {documents.length === 0 ? (
          <EmptyState
            type={getEmptyStateType()}
            onAction={handleEmptyStateAction}
          />
        ) : (
          <div className="p-6">
            <div className={cn(
              'transition-all duration-300',
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : 'space-y-4'
            )}>
              {documents.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    selectedDocuments.includes(document.id) && 'ring-2 ring-primary',
                    'rounded-lg transition-all duration-200'
                  )}
                  onClick={(e) => {
                    if (e.ctrlKey || e.metaKey) {
                      e.preventDefault();
                      selectDocument(document.id);
                    }
                  }}
                >
                  <DocumentCard
                    document={document}
                    viewMode={viewMode}
                    onEdit={handleEditDocument}
                    onDuplicate={handleDuplicateDocument}
                    onDelete={handleDeleteDocument}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}
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
              문서 삭제
            </h3>
            <p className="text-muted-foreground mb-6">
              이 문서를 삭제하시겠습니까? 삭제된 문서는 복구할 수 없습니다.
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

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card p-6 rounded-lg shadow-lg max-w-md mx-4"
          >
            <h3 className="text-lg font-semibold text-foreground mb-3">
              선택된 문서 삭제
            </h3>
            <p className="text-muted-foreground mb-6">
              선택된 {selectedDocuments.length}개의 문서를 삭제하시겠습니까? 
              삭제된 문서는 복구할 수 없습니다.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                className="px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}