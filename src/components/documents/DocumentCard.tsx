'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Heart,
  MoreHorizontal,
  Edit3,
  Copy,
  Trash2,
  Calendar,
  Type,
  Tag
} from 'lucide-react';
import { Document, DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS } from '@/types/document';
import { useDocumentStore } from '@/stores/documentStore';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  document: Document;
  viewMode?: 'grid' | 'list';
  onEdit?: (document: Document) => void;
  onDuplicate?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  className?: string;
}

export default function DocumentCard({
  document,
  viewMode = 'grid',
  onEdit,
  onDuplicate,
  onDelete,
  className
}: DocumentCardProps) {
  const { toggleFavorite, markAsRecent } = useDocumentStore();
  const [showActions, setShowActions] = React.useState(false);

  const handleCardClick = () => {
    markAsRecent(document.id);
    // Navigate to editor with document ID
    window.location.href = `/editor?id=${document.id}`;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(document.id);
  };

  const handleActionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(!showActions);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    if (onEdit) {
      onEdit(document);
    } else {
      handleCardClick();
    }
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    onDuplicate?.(document);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    onDelete?.(document);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getCategoryColor = (category: Document['category']) => {
    switch (category) {
      case 'email':
        return 'bg-blue-100 text-blue-700';
      case 'letter':
        return 'bg-purple-100 text-purple-700';
      case 'creative':
        return 'bg-pink-100 text-pink-700';
      case 'business':
        return 'bg-indigo-100 text-indigo-700';
      case 'personal':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'group relative flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer',
          className
        )}
        onClick={handleCardClick}
      >
        {/* Document Icon */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        {/* Document Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <h3 className="font-medium text-foreground truncate mb-1">
                {document.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {document.excerpt || '내용 없음'}
              </p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(document.updatedAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Type className="w-3 h-3" />
                  {document.wordCount.toLocaleString()}자
                </div>
                {document.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {document.tags.slice(0, 2).join(', ')}
                    {document.tags.length > 2 && ' +'}
                  </div>
                )}
              </div>
            </div>

            {/* Status and Category */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  getCategoryColor(document.category)
                )}>
                  {DOCUMENT_CATEGORY_LABELS[document.category]}
                </span>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  getStatusColor(document.status)
                )}>
                  {DOCUMENT_STATUS_LABELS[document.status]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className={cn(
              'p-2 rounded-lg transition-colors',
              document.isFavorite
                ? 'text-red-500 hover:bg-red-50'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Heart className={cn('w-4 h-4', document.isFavorite && 'fill-current')} />
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleActionsClick}
              className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
              >
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground bg-white hover:bg-accent"
                  >
                    <Edit3 className="w-4 h-4" />
                    편집
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground bg-white hover:bg-accent"
                  >
                    <Copy className="w-4 h-4" />
                    복사
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-all duration-200 cursor-pointer',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              getCategoryColor(document.category)
            )}>
              {DOCUMENT_CATEGORY_LABELS[document.category]}
            </span>
            <span className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              getStatusColor(document.status)
            )}>
              {DOCUMENT_STATUS_LABELS[document.status]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              document.isFavorite
                ? 'text-red-500 hover:bg-red-50'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Heart className={cn('w-4 h-4', document.isFavorite && 'fill-current')} />
          </motion.button>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleActionsClick}
              className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            {showActions && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-lg shadow-lg z-10"
              >
                <div className="py-1">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground bg-white hover:bg-accent"
                  >
                    <Edit3 className="w-4 h-4" />
                    편집
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground bg-white hover:bg-accent"
                  >
                    <Copy className="w-4 h-4" />
                    복사
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
        {document.title}
      </h3>

      {/* Excerpt */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {document.excerpt || '내용 없음'}
      </p>

      {/* Tags */}
      {document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {document.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full"
            >
              {tag}
            </span>
          ))}
          {document.tags.length > 3 && (
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
              +{document.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(document.updatedAt)}
          </div>
          <div className="flex items-center gap-1">
            <Type className="w-3 h-3" />
            {document.wordCount.toLocaleString()}자
          </div>
        </div>

        {document.aiRequestsUsed > 0 && (
          <div className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1 rounded-full">
            AI {document.aiRequestsUsed}회
          </div>
        )}
      </div>
    </motion.div>
  );
}