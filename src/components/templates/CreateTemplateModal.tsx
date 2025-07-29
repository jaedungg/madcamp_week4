'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  BookTemplate,
  Wand2,
  Eye,
  Save,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  RefreshCw,
  Copy,
  Mail,
  MessageSquare,
  PenTool,
  Briefcase,
  Users,
  GraduationCap,
  TrendingUp
} from 'lucide-react';
import {
  TemplateCategory,
  TemplateDifficulty,
  TemplateTone,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_DIFFICULTY_LABELS,
  TEMPLATE_TONE_LABELS
} from '@/types/template';
import { cn } from '@/lib/utils';

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (template: any) => void;
}

interface TemplateData {
  title: string;
  content: string;
  category: TemplateCategory;
  difficulty: TemplateDifficulty;
  tone: TemplateTone;
  tags: string[];
  estimatedWords: number;
  preview: string;
}

interface GeneratedTemplate extends TemplateData {
  metadata?: {
    prompt: string;
    includeVariables: boolean;
    generatedAt: string;
  };
}

type Step = 'basic' | 'generate' | 'edit' | 'preview';

const categoryIcons: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  letter: MessageSquare,
  creative: PenTool,
  business: Briefcase,
  social: Users,
  academic: GraduationCap,
  marketing: TrendingUp
};

export default function CreateTemplateModal({ isOpen, onClose, onSuccess }: CreateTemplateModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 기본 템플릿 데이터
  const [templateData, setTemplateData] = useState<TemplateData>({
    title: '',
    content: '',
    category: 'business',
    difficulty: 'intermediate',
    tone: 'professional',
    tags: [],
    estimatedWords: 200,
    preview: ''
  });

  // AI 생성 관련 상태
  const [aiPrompt, setAiPrompt] = useState('');
  const [includeVariables, setIncludeVariables] = useState(true);
  const [examplePrompts, setExamplePrompts] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedTemplate | null>(null);

  // 태그 입력 상태
  const [tagInput, setTagInput] = useState('');

  // 단계별 제목
  const stepTitles = {
    basic: '기본 정보',
    generate: 'AI 도움',
    edit: '내용 편집',
    preview: '미리보기'
  };

  // 예시 프롬프트 로드
  useEffect(() => {
    if (currentStep === 'generate') {
      fetchExamplePrompts();
    }
  }, [currentStep, templateData.category]);

  const fetchExamplePrompts = async () => {
    try {
      const response = await fetch(`/api/templates/generate?category=${templateData.category}`);
      const result = await response.json();
      if (result.success) {
        setExamplePrompts(result.examples || []);
      }
    } catch (error) {
      console.error('예시 프롬프트 로드 실패:', error);
    }
  };

  // AI 콘텐츠 생성
  const generateContent = async () => {
    if (!aiPrompt.trim()) {
      setError('프롬프트를 입력해주세요');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          category: templateData.category,
          tone: templateData.tone,
          difficulty: templateData.difficulty,
          estimatedWords: templateData.estimatedWords,
          includeVariables
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'AI 생성에 실패했습니다');
      }

      setGeneratedContent(result.generatedTemplate);
      setTemplateData(prev => ({
        ...prev,
        title: result.generatedTemplate.title,
        content: result.generatedTemplate.content,
        tags: result.generatedTemplate.tags,
        preview: result.generatedTemplate.preview
      }));

      setCurrentStep('edit');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'AI 생성에 실패했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // 템플릿 저장
  const saveTemplate = async () => {
    if (!templateData.title.trim() || !templateData.content.trim()) {
      setError('제목과 내용을 모두 입력해주세요');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '템플릿 저장에 실패했습니다');
      }

      onSuccess(result.template);
      resetModal();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : '템플릿 저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 모달 초기화
  const resetModal = () => {
    setCurrentStep('basic');
    setTemplateData({
      title: '',
      content: '',
      category: 'business',
      difficulty: 'intermediate',
      tone: 'professional',
      tags: [],
      estimatedWords: 200,
      preview: ''
    });
    setAiPrompt('');
    setTagInput('');
    setGeneratedContent(null);
    setError('');
  };

  // 태그 추가
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !templateData.tags.includes(trimmedTag) && templateData.tags.length < 10) {
      setTemplateData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  // 태그 제거
  const removeTag = (tagToRemove: string) => {
    setTemplateData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 다음 단계로
  const nextStep = () => {
    const steps: Step[] = ['basic', 'generate', 'edit', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  // 이전 단계로
  const prevStep = () => {
    const steps: Step[] = ['basic', 'generate', 'edit', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // 단계 건너뛰기 (직접 작성)
  const skipToEdit = () => {
    setCurrentStep('edit');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-card bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BookTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">새 템플릿 만들기</h2>
              <p className="text-sm text-muted-foreground">{stepTitles[currentStep]}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            {(['basic', 'generate', 'edit', 'preview'] as Step[]).map((step, index) => {
              const isActive = currentStep === step;
              const isCompleted = ['basic', 'generate', 'edit', 'preview'].indexOf(currentStep) > index;
              const Icon = step === 'basic' ? BookTemplate :
                step === 'generate' ? Sparkles :
                  step === 'edit' ? PenTool : Eye;

              return (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all',
                    isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-100 text-green-700' :
                        'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {stepTitles[step]}
                    </span>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Basic Info */}
            {currentStep === 'basic' && (
              <motion.div
                key="basic"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">템플릿 기본 정보를 설정해주세요</h3>

                  {/* Category Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-3">
                      카테고리
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => {
                        const Icon = categoryIcons[key as TemplateCategory];
                        const isSelected = templateData.category === key;
                        return (
                          <motion.button
                            key={key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setTemplateData(prev => ({ ...prev, category: key as TemplateCategory }))}
                            className={cn(
                              'flex items-center gap-2 p-3 rounded-lg border transition-all',
                              isSelected
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{label}</span>
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
                        value={templateData.difficulty}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, difficulty: e.target.value as TemplateDifficulty }))}
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
                        value={templateData.tone}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, tone: e.target.value as TemplateTone }))}
                        className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        {Object.entries(TEMPLATE_TONE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
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
                      value={templateData.estimatedWords}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, estimatedWords: parseInt(e.target.value) || 200 }))}
                      className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={skipToEdit}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    직접 작성하기
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                  >
                    다음
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: AI Generation */}
            {currentStep === 'generate' && (
              <motion.div
                key="generate"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI로 템플릿 생성하기</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    원하는 템플릿의 주제나 상황을 설명해주시면 AI가 초안을 만들어드려요
                  </p>

                  {/* AI Prompt Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      어떤 템플릿을 만들고 싶으신가요?
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="예: 프로젝트 진행 상황을 보고하는 이메일"
                      className="w-full h-24 p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    />
                  </div>

                  {/* Example Prompts */}
                  {examplePrompts.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        <Lightbulb className="w-4 h-4 inline mr-1" />
                        예시 아이디어
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {examplePrompts.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => setAiPrompt(example)}
                            className="text-left p-3 bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors text-sm"
                          >
                            {example}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Options */}
                  <div className="flex items-center gap-4 mb-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeVariables}
                        onChange={(e) => setIncludeVariables(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/30"
                      />
                      <span className="text-sm text-foreground">변수 포함 ([이름], [날짜] 등)</span>
                    </label>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    이전
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={skipToEdit}
                      className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      건너뛰기
                    </button>
                    <button
                      onClick={generateContent}
                      disabled={!aiPrompt.trim() || isGenerating}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          AI로 생성하기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Edit Content */}
            {currentStep === 'edit' && (
              <motion.div
                key="edit"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">템플릿 내용 편집</h3>

                  {/* Title */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      제목
                    </label>
                    <input
                      type="text"
                      value={templateData.title}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="템플릿 제목을 입력하세요"
                      className="w-full p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      내용
                    </label>
                    <textarea
                      value={templateData.content}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="템플릿 내용을 입력하세요..."
                      className="w-full h-64 p-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {templateData.content.length}자 / 예상: {templateData.estimatedWords}자
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      태그
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {templateData.tags.map((tag, index) => (
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
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    이전
                  </button>
                  <button
                    onClick={nextStep}
                    disabled={!templateData.title.trim() || !templateData.content.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    미리보기
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">템플릿 미리보기</h3>

                  {/* Template Preview Card */}
                  <div className="bg-muted/50 border border-border rounded-lg p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">{templateData.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                            {TEMPLATE_CATEGORY_LABELS[templateData.category]}
                          </span>
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                            {TEMPLATE_DIFFICULTY_LABELS[templateData.difficulty]}
                          </span>
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                            {TEMPLATE_TONE_LABELS[templateData.tone]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">내용 미리보기:</p>
                      <div className="bg-background border border-border rounded-md p-4 max-h-64 overflow-auto">
                        <pre className="whitespace-pre-wrap text-sm text-foreground font-sans">
                          {templateData.content}
                        </pre>
                      </div>
                    </div>

                    {templateData.tags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">태그:</p>
                        <div className="flex flex-wrap gap-1">
                          {templateData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-accent text-accent-foreground rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      예상 글자 수: {templateData.estimatedWords}자 / 실제: {templateData.content.length}자
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    수정하기
                  </button>
                  <button
                    onClick={saveTemplate}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        템플릿 저장
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}