'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, Upload, Trash2, Search, Filter, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DocumentCard from '@/components/documents/DocumentCard';
import SearchAndFilters from '@/components/documents/SearchAndFilters';
import ViewToggle from '@/components/documents/ViewToggle';
import EmptyState from '@/components/documents/EmptyState';
import { cn } from '@/lib/utils';
import { Document } from '@/types/document';

interface DocumentsResponse {
  success: boolean;
  documents: Document[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  stats: Array<{
    category: string;
    _count: { _all: number };
  }>;
}

export default function DocumentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 필터링 및 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocuments, setTotalDocuments] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const limit = 12;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // 문서 목록 불러오기
  const loadDocuments = async () => {
    if (!session?.user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        user_id: session.user.email,
        page: currentPage.toString(),
        limit: limit.toString(),
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
        sortBy: sortBy,
        sortOrder: sortOrder,
        favoritesOnly: favoritesOnly.toString()
      });

      const response = await fetch(`/api/documents?${params}`);
      
      if (!response.ok) {
        throw new Error('문서 목록을 불러올 수 없습니다.');
      }

      const data: DocumentsResponse = await response.json();
      
      if (data.success) {
        setDocuments(data.documents);
        setTotalPages(data.pagination.totalPages);
        setTotalDocuments(data.pagination.total);
      } else {
        throw new Error('문서 목록을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('문서 목록 불러오기 오류:', error);
      setError(error instanceof Error ? error.message : '문서 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = () => {
    router.push('/editor');
  };

  const handleEditDocument = (document: Document) => {
    router.push(`/editor?id=${document.id}`);
  };

  const handleDuplicateDocument = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/duplicate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('문서 복제에 실패했습니다.');
      }

      const duplicatedDoc = await response.json();
      
      // 목록 맨 앞에 추가
      setDocuments(prev => [duplicatedDoc, ...prev]);
      setTotalDocuments(prev => prev + 1);
      
      console.log('문서가 복제되었습니다.');
    } catch (error) {
      console.error('문서 복제 오류:', error);
      alert(error instanceof Error ? error.message : '문서 복제 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteDocument = (document: Document) => {
    setShowDeleteConfirm(document.id);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      const response = await fetch(`/api/documents/${showDeleteConfirm}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('문서 삭제에 실패했습니다.');
      }

      // 목록에서 제거
      setDocuments(prev => prev.filter(doc => doc.id !== showDeleteConfirm));
      setTotalDocuments(prev => prev - 1);
      setShowDeleteConfirm(null);
      
      console.log('문서가 삭제되었습니다.');
    } catch (error) {
      console.error('문서 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '문서 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleBulkDelete = () => {
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const response = await fetch('/api/documents/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentIds: selectedDocuments }),
      });

      if (!response.ok) {
        throw new Error('문서 삭제에 실패했습니다.');
      }

      // 목록에서 제거
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setTotalDocuments(prev => prev - selectedDocuments.length);
      setSelectedDocuments([]);
      setShowBulkDeleteConfirm(false);
      
      console.log('선택된 문서들이 삭제되었습니다.');
    } catch (error) {
      console.error('일괄 삭제 오류:', error);
      alert(error instanceof Error ? error.message : '문서 삭제 중 오류가 발생했습니다.');
    }
  };

  // 문서 즐겨찾기 토글
  const handleToggleFavorite = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/favorite`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('즐겨찾기 변경에 실패했습니다.');
      }

      const updatedDoc = await response.json();
      
      // 목록에서 업데이트
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, is_favorite: updatedDoc.is_favorite }
          : doc
      ));
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
      alert(error instanceof Error ? error.message : '즐겨찾기 변경 중 오류가 발생했습니다.');
    }
  };

  const handleExportDocuments = async () => {
    try {
      const response = await fetch('/api/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: session?.user?.email }),
      });

      if (!response.ok) {
        throw new Error('문서 내보내기에 실패했습니다.');
      }

      const blob = await response.blob();
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
      alert(error instanceof Error ? error.message : '문서 내보내기 중 오류가 발생했습니다.');
    }
  };

  const handleImportDocuments = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.documents && Array.isArray(data.documents)) {
          const response = await fetch('/api/documents/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documents: data.documents,
              user_id: session?.user?.email
            }),
          });

          if (!response.ok) {
            throw new Error('문서 가져오기에 실패했습니다.');
          }

          // 목록 새로고침
          loadDocuments();
          console.log('문서를 성공적으로 가져왔습니다.');
        } else {
          alert('올바르지 않은 파일 형식입니다.');
        }
      } catch (error) {
        console.error('파일 읽기 실패:', error);
        alert(error instanceof Error ? error.message : '파일 처리 중 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const getEmptyStateType = () => {
    if (searchQuery) return 'search';
    if (favoritesOnly) return 'favorites';
    if (selectedCategory !== 'all' || selectedStatus !== 'all') return 'filter';
    return 'documents';
  };

  const handleEmptyStateAction = () => {
    const emptyType = getEmptyStateType();

    switch (emptyType) {
      case 'search':
        setSearchQuery('');
        break;
      case 'filter':
      case 'favorites':
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedStatus('all');
        setFavoritesOnly(false);
        break;
      case 'documents':
      default:
        handleCreateDocument();
        break;
    }
  };

  // 문서 선택 처리
  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  // 필터 변경 시 문서 재로딩
  useEffect(() => {
    if (session?.user?.email) {
      setCurrentPage(1); // 필터 변경 시 첫 페이지로
      loadDocuments();
    }
  }, [session, searchQuery, selectedCategory, selectedStatus, sortBy, sortOrder, favoritesOnly]);

  // 페이지 변경 시 문서 재로딩
  useEffect(() => {
    if (session?.user?.email) {
      loadDocuments();
    }
  }, [currentPage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">문서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={loadDocuments}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">모든 문서</h1>
            <p className="text-muted-foreground">
              총 {totalDocuments}개의 문서
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
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="문서 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">모든 카테고리</option>
                <option value="draft">초안</option>
                <option value="published">게시됨</option>
                <option value="archived">보관됨</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>

              {/* Favorites Only */}
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                  favoritesOnly
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-accent'
                )}
              >
                <Star className="w-4 h-4" />
                즐겨찾기
              </button>
            </div>
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
                      handleSelectDocument(document.id);
                    }
                  }}
                >
                  <DocumentCard
                    document={document}
                    viewMode={viewMode}
                    onEdit={() => handleEditDocument(document)}
                    onDuplicate={() => handleDuplicateDocument(document)}
                    onDelete={() => handleDeleteDocument(document)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-6">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'px-3 py-2 rounded-lg',
                      currentPage === page
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
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