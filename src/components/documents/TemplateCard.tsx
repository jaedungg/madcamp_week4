'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BookTemplate,
  Heart,
  MoreHorizontal,
  Play,
  Copy,
  Trash2,
  Edit3,
  TrendingUp,
  Clock,
  Star,
  Users,
  Sparkle
} from 'lucide-react';
import {
  Template,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_DIFFICULTY_LABELS,
  TEMPLATE_TONE_LABELS
} from '@/types/template';
import {
  DocumentCategory,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_DIFFICULTY_LABELS,
  DOCUMENT_TONE_LABELS
} from '@/types/document';
import { useTemplateStore } from '@/stores/templateStore';
import { useDocumentStore } from '@/stores/documentStore';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: Template;
  onUse?: (template: Template) => void;
  onEdit?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  className?: string;
}

export default function TemplateCard({
  template,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
  className
}: TemplateCardProps) {
  const { toggleFavorite } = useTemplateStore();
  const { createDocument } = useDocumentStore();
  const [showActions, setShowActions] = React.useState(false);

  const handleUseTemplate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onUse) {
      onUse(template);
    } else {
      // Default behavior: create new document with template content
      const newDoc = createDocument(template.title, template.category as DocumentCategory);
      // Navigate to editor with the new document and template content
      const params = new URLSearchParams({
        id: newDoc.id,
        templateContent: template.content
      });
      window.location.href = `/editor?${params.toString()}`;
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(template.id);
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
    onEdit?.(template);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    onDuplicate?.(template);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowActions(false);
    onDelete?.(template);
  };

  const getCategoryColor = (category: Template['category']) => {
    switch (category) {
      case 'email':
        return 'bg-blue-100 text-blue-700';
      case 'letter':
        return 'bg-purple-100 text-purple-700';
      case 'creative':
        return 'bg-pink-100 text-pink-700';
      case 'business':
        return 'bg-indigo-100 text-indigo-700';
      case 'social':
        return 'bg-green-100 text-green-700';
      case 'academic':
        return 'bg-orange-100 text-orange-700';
      case 'marketing':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: Template['difficulty']) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getToneIcon = (tone: Template['tone']) => {
    switch (tone) {
      case 'formal':
        return '🎩';
      case 'professional':
        return '💼';
      case 'friendly':
        return '😊';
      case 'casual':
        return '👋';
      case 'creative':
        return '🎨';
      default:
        return '📝';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={cn(
        'group relative bg-card border rounded-lg p-4 hover:shadow-lg transition-all duration-200',
        template.isBuiltIn
          ? 'border-blue-200 bg-gradient-to-br from-blue-50/30 to-transparent'
          : 'border-border',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BookTemplate className="w-4 h-4 text-white" />
          </div>
          {template.isBuiltIn && (
            <div className="flex items-center gap-1 text-xs text-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 px-2.5 py-1 rounded-full font-medium ">
              <Sparkle className="w-3 h-3" />
              공식
            </div>
          )}
        </div>

        <div className={`flex items-center gap-1 ${!template.isFavorite && "opacity-0"}  group-hover:opacity-100 transition-opacity`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleFavoriteClick}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              template.isFavorite
                ? 'text-red-500 hover:bg-red-50'
                : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Heart className={cn('w-4 h-4', template.isFavorite && 'fill-current')} />
          </motion.button>

          {!template.isBuiltIn && (
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
                  className="absolute right-0 top-full mt-1 w-40 bg-card bg-white border border-border rounded-lg shadow-lg z-10"
                >
                  <div className="py-1">
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <Edit3 className="w-4 h-4" />
                      편집
                    </button>
                    <button
                      onClick={handleDuplicate}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <Copy className="w-4 h-4" />
                      복사
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
        {template.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {template.description || template.preview || '템플릿 설명이 없습니다.'}
      </p>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={cn(
          'text-xs px-2 py-1 rounded-full font-medium',
          getCategoryColor(template.category)
        )}>
          {TEMPLATE_CATEGORY_LABELS[template.category]}
        </span>

        {/* <span className={cn(
          'text-xs px-2 py-1 rounded-full font-medium',
          getDifficultyColor(template.difficulty)
        )}>
          {TEMPLATE_DIFFICULTY_LABELS[template.difficulty]}
        </span> */}
        
        {/* Tags */}
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, template.tags.length > 3 ? 2 : 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="text-xs px-2 py-1 bg-accent text-accent-foreground rounded-full">
                +{template.tags.length - 2}
              </span>
            )}
          </div>
        )}

        <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full flex items-center gap-1">
          <span>{getToneIcon(template.tone)}</span>
          {TEMPLATE_TONE_LABELS[template.tone]}
        </span>
      </div>



      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {(template.usageCount || 0).toLocaleString()}회 사용
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            약 {template.estimatedWords || 100}자
          </div>
        </div>

        {/* {(template.usageCount || 0) > 10 && (
          <div className="flex items-center gap-1 text-orange-600">
            <TrendingUp className="w-3 h-3" />
            인기
          </div>
        )} */}
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleUseTemplate}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors font-medium"
      >
        <Play className="w-4 h-4" />
        템플릿 사용하기
      </motion.button>

      {/* Preview on hover
      <div className="absolute inset-0 bg-card/95 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 overflow-hidden">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-foreground">미리보기</h4>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUseTemplate}
              className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm"
            >
              <Play className="w-3 h-3" />
              사용
            </motion.button>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6">
              {template.preview || template.content.substring(0, 200) + '...'}
            </p>
          </div>
        </div>
      </div> */}
    </motion.div>
  );
}