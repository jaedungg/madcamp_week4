'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  BookTemplate, 
  Search, 
  Plus, 
  Filter,
  Clock,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  type: 'documents' | 'templates' | 'recent' | 'search' | 'filter' | 'favorites';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

const emptyStates = {
  documents: {
    icon: FileText,
    title: '아직 작성한 문서가 없어요',
    description: '첫 번째 문서를 작성해서 AI 글쓰기 도우미와 함께 멋진 글을 만들어보세요.',
    actionText: '새 문서 작성하기'
  },
  templates: {
    icon: BookTemplate,
    title: '사용 가능한 템플릿이 없어요',
    description: '원하는 템플릿을 찾을 수 없거나 필터 조건과 일치하는 템플릿이 없습니다.',
    actionText: '필터 초기화'
  },
  recent: {
    icon: Clock,
    title: '최근 작업한 문서가 없어요',
    description: '문서를 편집하면 여기에 최근 활동 기록이 표시됩니다.',
    actionText: '새 문서 작성하기'
  },
  search: {
    icon: Search,
    title: '검색 결과가 없어요',
    description: '다른 키워드로 검색해보거나 필터를 조정해보세요.',
    actionText: '검색어 지우기'
  },
  filter: {
    icon: Filter,
    title: '필터 조건에 맞는 항목이 없어요',
    description: '필터 조건을 변경하거나 초기화해서 더 많은 결과를 확인해보세요.',
    actionText: '필터 초기화'
  },
  favorites: {
    icon: Heart,
    title: '즐겨찾기한 항목이 없어요',
    description: '마음에 드는 문서나 템플릿을 즐겨찾기에 추가해보세요.',
    actionText: '전체 보기'
  }
};

export default function EmptyState({
  type,
  title,
  description,
  actionText,
  onAction,
  className
}: EmptyStateProps) {
  const config = emptyStates[type];
  const Icon = config.icon;

  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalActionText = actionText || config.actionText;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6"
      >
        <Icon className="w-10 h-10 text-muted-foreground" />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-semibold text-foreground mb-3"
      >
        {finalTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground max-w-md mb-8 leading-relaxed"
      >
        {finalDescription}
      </motion.p>

      {/* Action Button */}
      {onAction && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-colors"
        >
          {type === 'documents' || type === 'recent' ? (
            <Plus className="w-4 h-4" />
          ) : type === 'search' ? (
            <Search className="w-4 h-4" />
          ) : type === 'filter' || type === 'templates' ? (
            <Filter className="w-4 h-4" />
          ) : (
            <Heart className="w-4 h-4" />
          )}
          {finalActionText}
        </motion.button>
      )}

      {/* Additional hints */}
      {type === 'documents' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-muted/50 rounded-lg max-w-md"
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>팁:</strong> 템플릿을 사용하면 더 쉽게 글을 시작할 수 있어요. 
            <br />사이드바에서 템플릿을 확인해보세요!
          </p>
        </motion.div>
      )}

      {type === 'search' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 space-y-2 text-sm text-muted-foreground"
        >
          <p><strong>검색 팁:</strong></p>
          <ul className="space-y-1 text-left max-w-sm">
            <li>• 제목, 내용, 태그로 검색할 수 있어요</li>
            <li>• 카테고리나 상태로 필터링 해보세요</li>
            <li>• 즐겨찾기한 항목만 볼 수도 있어요</li>
          </ul>
        </motion.div>
      )}

      {type === 'templates' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-muted/50 rounded-lg max-w-md"
        >
          <p className="text-sm text-muted-foreground">
            💡 <strong>알려드려요:</strong> 프롬에는 이메일, 편지, 창작글 등 
            다양한 공식 템플릿이 준비되어 있어요!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}