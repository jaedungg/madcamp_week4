'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Plus, Calendar, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useDocumentStore } from '@/stores/documentStore';
import { useUserStore } from '@/stores/userStore';
import { RecentDocument, Document } from '@/types/document';
import DocumentCard from '@/components/documents/DocumentCard';
import ViewToggle from '@/components/documents/ViewToggle';
import EmptyState from '@/components/documents/EmptyState';
import { cn } from '@/lib/utils';
import {
  fetchRecentDocumentsWithRetry,
  logDocumentAccess,
  getErrorMessage,
  isApiError
} from '@/lib/api/documents';

interface ErrorState {
  hasError: boolean;
  message: string;
  canRetry: boolean;
}

export default function RecentDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    viewMode,
    setViewMode,
    createDocument,
    duplicateDocument,
    deleteDocument,
    markAsRecent
  } = useDocumentStore();

  const { incrementDocumentCount } = useUserStore();

  // 상태 관리
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ErrorState>({
    hasError: false,
    message: '',
    canRetry: false
  });
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // 인증 상태 확인
  useEffect(() => {
    setIsClient(true);

    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
  }, [status, router]);

  // 최근 문서 데이터 가져오기
  const loadRecentDocuments = async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError({ hasError: false, message: '', canRetry: false });

    try {
      const documents = await fetchRecentDocumentsWithRetry(session.user.id, 50);
      setRecentDocuments(documents);
    } catch (err) {
      console.error('Failed to load recent documents:', err);

      const errorMessage = getErrorMessage(err);
      const canRetry = !isApiError(err) || (isApiError(err) && err.status >= 500);

      setError({
        hasError: true,
        message: errorMessage,
        canRetry
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 최초 데이터 로드
  useEffect(() => {
    if (session?.user?.id && isClient) {
      loadRecentDocuments();
    }
  }, [session?.user?.id, isClient]);

  // 시간 필터링된 문서들 (중복 제거 포함)
  const filteredRecentDocuments = useMemo(() => {
    if (!isClient) return recentDocuments;

    // 1. 먼저 ID로 중복 제거
    const uniqueDocuments = recentDocuments.reduce((acc, current) => {
      const existingIndex = acc.findIndex(doc => doc.id === current.id);
      if (existingIndex === -1) {
        acc.push(current);
      } else {
        // 같은 ID가 있다면 더 최근에 접근한 것을 사용
        if (current.lastAccessedAt > acc[existingIndex].lastAccessedAt) {
          acc[existingIndex] = current;
        }
      }
      return acc;
    }, [] as RecentDocument[]);

    // 2. 시간 필터 적용
    return uniqueDocuments.filter(doc => {
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
  }, [recentDocuments, timeFilter, isClient]);

  // 활동 통계 계산
  const { today, thisWeek, totalTimeSpent } = useMemo(() => {
    if (!isClient) {
      return { today: 0, thisWeek: 0, totalTimeSpent: 0 };
    }

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
  }, [recentDocuments, isClient]);

  // 이벤트 핸들러들
  const handleCreateDocument = async () => {
    if (!session?.user?.id) {
      router.push('/login');
      return;
    }

    try {
      // 실제 데이터베이스에 문서 생성
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '제목 없는 문서',
          content: '',
          category: 'draft',
          tags: [],
        }),
      });

      if (!response.ok) {
        throw new Error('문서 생성에 실패했습니다.');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '문서 생성에 실패했습니다.');
      }

      // 로컬 store도 업데이트 (선택사항)
      const newDoc = createDocument();
      incrementDocumentCount();

      // 실제 데이터베이스의 UUID를 사용해서 에디터로 이동
      router.push(`/editor?id=${data.document.id}`);
    } catch (error) {
      console.error('문서 생성 실패:', error);
      alert(error instanceof Error ? error.message : '문서 생성 중 오류가 발생했습니다.');
    }
  };

  const handleEditDocument = async (document: Document) => {
    // 로컬 스토어 업데이트
    markAsRecent(document.id);

    // 데이터베이스에 접근 로그 기록
    if (session?.user?.id) {
      try {
        await logDocumentAccess(document.id, session.user.id);
      } catch (error) {
        console.warn('Failed to log document access:', error);
        // 로그 실패는 사용자 경험을 방해하지 않음
      }
    }

    router.push(`/editor?id=${document.id}`);
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
      // 로컬 상태에서도 제거
      setRecentDocuments(prev => prev.filter(doc => doc.id !== showDeleteConfirm));
      setShowDeleteConfirm(null);
    }
  };

  const formatRelativeTime = (date: Date) => {
    if (!isClient) return '로딩 중...';

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

  // 문서가 수정된 것인지 단순 접근인지 판단
  const getDocumentActivityInfo = (document: RecentDocument) => {
    // timeSpent가 0이고 lastAccessedAt이 lastModifiedAt과 비슷하면 수정으로 간주
    const timeDiff = Math.abs(document.lastAccessedAt.getTime() - document.lastModifiedAt.getTime());
    const isModification = document.timeSpent === 0 && timeDiff < 60000; // 1분 이내 차이

    return {
      isModification,
      activityType: isModification ? '수정' : '열람',
      displayTime: isModification ? document.lastModifiedAt : document.lastAccessedAt,
      icon: isModification ? '' : ''
    };
  };

  // 로딩 상태
  if (status === 'loading' || !isClient) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  // 인증되지 않은 상태
  if (status === 'unauthenticated') {
    return null; // 리다이렉트 처리중
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 pb-2 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
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
        <div className="grid grid-cols-2 lg:grid-cols-3 md:grid-cols-3 sm:gap-3 gap-4 mb-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-300/25 to-blue-500/25 p-3 rounded-lg border border-blue-300/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div className="w-full flex-1 flex flex-row justify-between ml-1 mr-2 items-center">
                <p className="text-base dark:text-white text-blue-700">오늘 작업</p>
                <p className="text-xl font-bold dark:text-white text-blue-900">{today}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-green-300/25 to-green-500/25 p-3 rounded-lg border border-green-300/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 bg-green-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="w-full flex-1 flex flex-row justify-between ml-1 mr-2 items-center">
                <p className="text-base dark:text-white text-green-700">이번 주</p>
                <p className="text-xl dark:text-white font-bold text-green-900">{thisWeek}개</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-300/25 to-purple-500/25 p-3 rounded-lg border border-purple-300/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-8.5 h-8.5 bg-purple-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div className="w-full flex-1 flex flex-row justify-between ml-1 mr-2 items-center">
                <p className="text-base dark:text-white text-purple-700">총 작업시간</p>
                <p className="text-xl font-bold dark:text-white text-purple-900">{Math.round(totalTimeSpent)}분</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Time Filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg">
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
                    'px-2.5 py-1.5 text-sm rounded-md transition-all duration-200',
                    timeFilter === option.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent'
                  )}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>

            <div className="text-sm text-muted-foreground">
              {isClient ? `${filteredRecentDocuments.length}개 문서` : '로딩 중...'}
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
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">최근 문서를 불러오는 중...</p>
          </div>
        ) : error.hasError ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              문서를 불러올 수 없습니다
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {error.message}
            </p>
            {error.canRetry && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadRecentDocuments}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
              >
                다시 시도
              </motion.button>
            )}
          </div>
        ) : filteredRecentDocuments.length === 0 ? (
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
                        {(() => {
                          const activityInfo = getDocumentActivityInfo(document);
                          return (
                            <>
                              <span className="flex items-center gap-1">
                                <span className="text-sm">{activityInfo.icon}</span>
                                <Clock className="w-3 h-3" />
                                {formatRelativeTime(activityInfo.displayTime)}에 {activityInfo.activityType}
                              </span>
                              {document.timeSpent > 0 && (
                                <span>
                                  작업시간: {Math.round(document.timeSpent)}분
                                </span>
                              )}
                              {activityInfo.isModification && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  최근 수정됨
                                </span>
                              )}
                            </>
                          );
                        })()}
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
                    {/* Recent badge with modification indicator */}
                    {(() => {
                      const activityInfo = getDocumentActivityInfo(document);
                      return (
                        <div className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full flex items-center gap-1 ${activityInfo.isModification
                          ? 'bg-blue-500 text-white'
                          : 'bg-primary/90 text-primary-foreground'
                          }`}>
                          <span className="text-xs">{activityInfo.icon}</span>
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(activityInfo.displayTime)}
                        </div>
                      );
                    })()}
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
    </div>
  );
}