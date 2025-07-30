'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Save,
  RefreshCw,
  BookTemplate,
  Mail,
  MessageSquare,
  PenTool,
  Briefcase,
  Users,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import {
  Template,
  TemplateCategory,
  TemplateDifficulty,
  TemplateTone,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_DIFFICULTY_LABELS,
  TEMPLATE_TONE_LABELS
} from '@/types/template';
import { cn } from '@/lib/utils';

interface EditTemplateModalProps {
  isOpen: boolean;
  template: Template | null;
  onClose: () => void;
  onSuccess: (template: Template) => void;
}

const categoryIcons: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  letter: MessageSquare,
  creative: PenTool,
  business: Briefcase,
  social: Users,
  academic: GraduationCap,
  marketing: TrendingUp
};

export default function EditTemplateModal({ isOpen, template, onClose, onSuccess }: EditTemplateModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tagInput, setTagInput] = useState('');

  // 편집 가능한 템플릿 데이터
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'business' as TemplateCategory,
    difficulty: 'intermediate' as TemplateDifficulty,
    tone: 'professional' as TemplateTone,
    tags: [] as string[],
    estimatedWords: 200,
    preview: ''
  });

  // 템플릿 데이터 초기화
  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        content: template.content,
        category: template.category,
        difficulty: template.difficulty,
        tone: template.tone,
        tags: [...template.tags],
        estimatedWords: template.estimatedWords,
        preview: template.preview || template.description
      });
    }
  }, [template]);

  // 템플릿 수정 저장
  const saveChanges = async () => {
    if (!template) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '템플릿 수정에 실패했습니다');
      }

      onSuccess(result.template);
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : '템플릿 수정에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 모달 닫기 시 초기화
  const handleClose = () => {
    setError('');
    setTagInput('');
    onClose();
  };

  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">템플릿 편집</h2>
              <p className="text-sm text-muted-foreground">
                {template.isBuiltIn ? '공식 템플릿 (읽기 전용)' : '사용자 템플릿'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {template.isBuiltIn ? (
            /* Read-only view for built-in templates */
            <div className="space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  공식 템플릿은 수정할 수 없습니다. 복사본을 만들어서 편집해보세요.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">템플릿 정보</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">제목</label>
                    <div className="p-3 bg-muted/50 border border-border rounded-lg text-foreground">
                      {template.title}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">카테고리</label>
                      <div className="p-3 bg-muted/50 border border-border rounded-lg text-foreground">
                        {TEMPLATE_CATEGORY_LABELS[template.category]}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">난이도</label>
                      <div className="p-3 bg-muted/50 border border-border rounded-lg text-foreground">
                        {TEMPLATE_DIFFICULTY_LABELS[template.difficulty]}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">톤</label>
                      <div className="p-3 bg-muted/50 border border-border rounded-lg text-foreground">
                        {TEMPLATE_TONE_LABELS[template.tone]}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">내용</label>
                    <div className="p-3 bg-muted/50 border border-border rounded-lg max-h-64 overflow-auto">
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                        {template.content}
                      </pre>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">태그</label>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Editable form for user templates */
            <div className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">템플릿 편집</h3>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  제목
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  카테고리
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => {
                    const Icon = categoryIcons[key as TemplateCategory];
                    const isSelected = formData.category === key;
                    return (
                      <motion.button
                        key={key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData(prev => ({ ...prev, category: key as TemplateCategory }))}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-lg border transition-all text-sm',
                          isSelected
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty & Tone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    난이도
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as TemplateDifficulty }))}
                    className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(TEMPLATE_DIFFICULTY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    톤
                  </label>
                  <select
                    value={formData.tone}
                    onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value as TemplateTone }))}
                    className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(TEMPLATE_TONE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  내용
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-64 p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.content.length}자
                </p>
              </div>

              {/* Estimated Words */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  예상 글자 수
                </label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  step="50"
                  value={formData.estimatedWords}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedWords: parseInt(e.target.value) || 200 }))}
                  className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  태그
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                        setTagInput('');
                      }
                    }}
                    placeholder="태그 입력 후 Enter"
                    className="flex-1 p-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                  <button
                    onClick={() => {
                      addTag(tagInput);
                      setTagInput('');
                    }}
                    className="px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors text-sm"
                  >
                    추가
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
          >
            {template.isBuiltIn ? '닫기' : '취소'}
          </button>
          {!template.isBuiltIn && (
            <button
              onClick={saveChanges}
              disabled={isLoading || !formData.title.trim() || !formData.content.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}