'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Calendar, TrendingUp } from 'lucide-react';
import { useDocumentStore } from '@/stores/documentStore';
import { useUserStore } from '@/stores/userStore';
import { Document } from '@/types/document';
import DocumentCard from '@/components/documents/DocumentCard';
import ViewToggle from '@/components/documents/ViewToggle';
import EmptyState from '@/components/documents/EmptyState';
import { cn } from '@/lib/utils';

export default function RecentDocumentsPage() {
  const {
    viewMode,
    setViewMode,
    getRecentDocuments,
    createDocument,
    duplicateDocument,
    deleteDocument,
    markAsRecent
  } = useDocumentStore();

  const { incrementDocumentCount } = useUserStore();
  
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const recentDocuments = getRecentDocuments(50); // Get more recent documents
  
  // Filter recent documents by time
  const filteredRecentDocuments = recentDocuments.filter(doc => {
    if (timeFilter === 'all') return true;
    
    const now = new Date();
    const docDate = doc.lastAccessedAt;
    
    switch (timeFilter) {
      case 'today':
        return docDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return docDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return docDate >= monthAgo;
      default:
        return true;
    }
  });

  const handleCreateDocument = () => {
    const newDoc = createDocument();
    incrementDocumentCount();
    // Navigate to editor
    window.location.href = `/editor?id=${newDoc.id}`;
  };

  const handleEditDocument = (document: Document) => {
    markAsRecent(document.id);
    window.location.href = `/editor?id=${document.id}`;
  };

  const handleDuplicateDocument = (document: Document) => {
    try {
      const duplicatedDoc = duplicateDocument(document.id);
      incrementDocumentCount();
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

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const getActivityStats = () => {
    const now = new Date();
    const today = recentDocuments.filter(doc => 
      doc.lastAccessedAt.toDateString() === now.toDateString()
    ).length;
    
    const thisWeek = recentDocuments.filter(doc => {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return doc.lastAccessedAt >= weekAgo;
    }).length;

    const totalTimeSpent = recentDocuments.reduce((sum, doc) => sum + doc.timeSpent, 0);

    return { today, thisWeek, totalTimeSpent };
  };

  const { today, thisWeek, totalTimeSpent } = getActivityStats();

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Clock className="w-7 h-7 text-primary" />
              최근 문서
            </h1>
            <p className="text-muted-foreground">
              최근 활동한 문서들을 확인하고 작업을 이어가세요
            </p>
          </div>
          
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

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-blue-700">오늘 작업</p>
                <p className="text-xl font-bold text-blue-900">{today}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-green-700">이번 주</p>
                <p className="text-xl font-bold text-green-900">{thisWeek}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-purple-700">총 작업시간</p>
                <p className="text-xl font-bold text-purple-900">{Math.round(totalTimeSpent)}분</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Time Filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {[
                { key: 'all', label: '전체' },
                { key: 'today', label: '오늘' },
                { key: 'week', label: '이번 주' },
                { key: 'month', label: '이번 달' }
              ].map((option) => (
                <motion.button
                  key={option.key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTimeFilter(option.key as 'all' | 'today' | 'week' | 'month')}
                  className={cn(
                    'px-3 py-2 text-sm rounded-md transition-all duration-200',
                    timeFilter === option.key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {filteredRecentDocuments.length}개 문서
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
        {filteredRecentDocuments.length === 0 ? (
          <EmptyState
            type="recent"
            onAction={handleCreateDocument}
          />
        ) : (
          <div className="p-6">
            {viewMode === 'list' ? (
              // List view with enhanced recent info
              <div className="space-y-4">
                {filteredRecentDocuments.map((document, index) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="pl-6">
                      <DocumentCard
                        document={document}
                        viewMode="list"
                        onEdit={handleEditDocument}
                        onDuplicate={handleDuplicateDocument}
                        onDelete={handleDeleteDocument}
                      />
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(document.lastAccessedAt)}에 수정
                        </span>
                        {document.timeSpent > 0 && (
                          <span>
                            작업시간: {Math.round(document.timeSpent)}분
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              // Grid view
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredRecentDocuments.map((document, index) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <DocumentCard
                      document={document}
                      viewMode="grid"
                      onEdit={handleEditDocument}
                      onDuplicate={handleDuplicateDocument}
                      onDelete={handleDeleteDocument}
                    />
                    {/* Recent badge */}
                    <div className="absolute top-2 left-2 bg-primary/90 text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(document.lastAccessedAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
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
    </div>
  );
}