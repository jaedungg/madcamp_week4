'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplateStore } from '@/stores/templateStore';
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
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Zap
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

interface GeneratedResult {
  id: string;
  title: string;
  content: string;
  preview: string;
  tags: string[];
  generatedAt: Date;
  prompt: string;
}

type Step = 'basic' | 'generate' | 'review' | 'edit' | 'preview';

const categoryIcons: Record<TemplateCategory, React.ComponentType<{ className?: string }>> = {
  email: Mail,
  letter: MessageSquare,
  creative: PenTool,
  business: Briefcase,
  social: Users,
  academic: GraduationCap,
  marketing: TrendingUp
};

const STORAGE_KEY = 'create-template-draft';

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
  const [generatedResults, setGeneratedResults] = useState<GeneratedResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<GeneratedResult | null>(null);

  // 태그 입력 상태
  const [tagInput, setTagInput] = useState('');

  // 단계별 완료 상태
  const [stepValidation, setStepValidation] = useState({
    basic: false,
    generate: false,
    review: false,
    edit: false,
    preview: false
  });

  // 단계별 요구사항과 제목
  const stepInfo = {
    basic: {
      title: '기본 정보',
      description: '템플릿의 기본 설정을 선택해주세요',
      required: '카테고리 선택 필수'
    },
    generate: {
      title: 'AI 도움',
      description: 'AI가 템플릿 초안을 만들어드려요',
      required: 'AI 사용시 프롬프트 입력 필수'
    },
    review: {
      title: '결과 확인',
      description: 'AI가 생성한 템플릿을 확인하고 선택하세요',
      required: '결과 중 하나 선택 필수'
    },
    edit: {
      title: '내용 편집',
      description: '템플릿 내용을 수정하고 완성하세요',
      required: '제목과 내용 입력 필수'
    },
    preview: {
      title: '최종 확인',
      description: '완성된 템플릿을 최종 확인하세요',
      required: '모든 정보 확인 완료'
    }
  };

  // 로컬 스토리지 자동저장
  useEffect(() => {
    if (isOpen) {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setTemplateData(draft.templateData || templateData);
          setAiPrompt(draft.aiPrompt || '');
          setIncludeVariables(draft.includeVariables ?? true);
        } catch (error) {
          console.warn('Failed to load draft:', error);
        }
      }
    }
  }, [isOpen]);

  // 자동저장
  useEffect(() => {
    if (isOpen) {
      const draft = {
        templateData,
        aiPrompt,
        includeVariables,
        currentStep,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }
  }, [templateData, aiPrompt, includeVariables, currentStep, isOpen]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentStep === 'basic') {
          onClose();
        } else {
          handlePrevious();
        }
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        if (canProceedToNext()) {
          handleNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  // 단계별 validation 확인
  const validateStep = useCallback((step: Step): boolean => {
    switch (step) {
      case 'basic':
        return !!templateData.category;
      case 'generate':
        // generate 단계는 선택사항이므로 항상 true
        return true;
      case 'review':
        return !!(selectedResult || (currentStep !== 'review'));
      case 'edit':
        return !!(templateData.title.trim() && templateData.content.trim());
      case 'preview':
        return !!(templateData.title.trim() && templateData.content.trim());
      default:
        return false;
    }
  }, [templateData, selectedResult, currentStep]);

  // 다음 단계로 진행 가능한지 확인
  const canProceedToNext = useCallback((): boolean => {
    if (currentStep === 'generate' && isGenerating) return false;
    return validateStep(currentStep);
  }, [currentStep, validateStep, isGenerating]);

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

      const newResult: GeneratedResult = {
        id: Date.now().toString(),
        title: result.generatedTemplate.title,
        content: result.generatedTemplate.content,
        preview: result.generatedTemplate.preview,
        tags: result.generatedTemplate.tags,
        generatedAt: new Date(),
        prompt: aiPrompt
      };

      setGeneratedResults(prev => [newResult, ...prev]);
      setSelectedResult(newResult);

      // review 단계로 자동 이동
      setCurrentStep('review');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'AI 생성에 실패했습니다');
    } finally {
      setIsGenerating(false);
    }
  };

  // 결과 선택
  const selectResult = (result: GeneratedResult) => {
    setSelectedResult(result);
    setTemplateData(prev => ({
      ...prev,
      title: result.title,
      content: result.content,
      tags: result.tags,
      preview: result.preview
    }));
  };

  // 다음 단계로
  const handleNext = () => {
    if (!canProceedToNext()) return;

    const steps: Step[] = ['basic', 'generate', 'review', 'edit', 'preview'];
    const currentIndex = steps.indexOf(currentStep);

    // generate 단계에서 AI를 사용하지 않는 경우 edit으로 바로 진행
    if (currentStep === 'generate' && generatedResults.length === 0) {
      setCurrentStep('edit');
      return;
    }

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }

    setError('');
  };

  // 이전 단계로
  const handlePrevious = () => {
    const steps: Step[] = ['basic', 'generate', 'review', 'edit', 'preview'];
    const currentIndex = steps.indexOf(currentStep);

    // review 단계에서 이전으로 가면 generate로
    if (currentStep === 'review') {
      setCurrentStep('generate');
      return;
    }

    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }

    setError('');
  };

  // 직접 작성하기 (generate 단계 건너뛰기)
  const skipToEdit = () => {
    setCurrentStep('edit');
    setError('');
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

      // 저장 성공시 로컬 스토리지 정리
      localStorage.removeItem(STORAGE_KEY);

      // 로컬 스토어에 새 템플릿 추가
      const templateStore = useTemplateStore.getState();
      templateStore.addTemplateFromAPI(result.template);

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
    setGeneratedResults([]);
    setSelectedResult(null);
    setError('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // 태그 관리
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !templateData.tags.includes(trimmedTag) && templateData.tags.length < 10) {
      setTemplateData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTemplateData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <BookTemplate className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">새 템플릿 만들기</h2>
              <p className="text-sm text-gray-600">
                {stepInfo[currentStep].description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {(['basic', 'generate', 'edit', 'preview'] as Step[]).map((step, index) => {
              const isActive = currentStep === step;
              const isCompleted = ['basic', 'generate', 'edit', 'preview'].indexOf(currentStep) > index;
              const isValid = validateStep(step);

              // review 단계는 UI에서 숨김 (내부적으로만 사용)
              if (step === 'review') return null;

              const Icon = step === 'basic' ? BookTemplate :
                step === 'generate' ? Sparkles :
                  step === 'edit' ? PenTool : Eye;

              return (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg transition-all relative',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                  )}>
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {stepInfo[step].title}
                    </span>
                    {isActive && !isValid && (
                      <AlertCircle className="w-4 h-4 text-yellow-300" />
                    )}
                    {isCompleted && (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </div>
                  {index < 3 && (
                    <ArrowRight className="w-4 h-4 mx-2 text-gray-400" />
                  )}
                </div>
              );
            })}
          </div>

          {/* 현재 단계 요구사항 표시 */}
          <div className="mt-2 text-xs text-gray-500">
            {stepInfo[currentStep].required}
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
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      카테고리 *
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
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900'
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        난이도
                      </label>
                      <select
                        value={templateData.difficulty}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, difficulty: e.target.value as TemplateDifficulty }))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(TEMPLATE_DIFFICULTY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        톤
                      </label>
                      <select
                        value={templateData.tone}
                        onChange={(e) => setTemplateData(prev => ({ ...prev, tone: e.target.value as TemplateTone }))}
                        className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Object.entries(TEMPLATE_TONE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Estimated Words */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      예상 글자 수
                    </label>
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      step="50"
                      value={templateData.estimatedWords}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, estimatedWords: parseInt(e.target.value) || 200 }))}
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                  <p className="text-sm text-gray-600 mb-6">
                    원하는 템플릿의 주제나 상황을 설명해주시면 AI가 초안을 만들어드려요
                  </p>

                  {/* AI Prompt Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      어떤 템플릿을 만들고 싶으신가요?
                    </label>
                    <textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="예: 프로젝트 진행 상황을 보고하는 이메일"
                      className="w-full h-24 p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* Example Prompts */}
                  {examplePrompts.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lightbulb className="w-4 h-4 inline mr-1" />
                        예시 아이디어
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {examplePrompts.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => setAiPrompt(example)}
                            className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors text-sm"
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
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">변수 포함 ([이름], [날짜] 등)</span>
                    </label>
                  </div>

                  {/* Generated Results */}
                  {generatedResults.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">생성된 템플릿들</h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {generatedResults.map((result) => (
                          <div
                            key={result.id}
                            className={cn(
                              'p-3 border rounded-lg cursor-pointer transition-colors',
                              selectedResult?.id === result.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            )}
                            onClick={() => selectResult(result)}
                          >
                            <div className="font-medium text-sm">{result.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {result.preview.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Review Results (AI 생성 후 결과 확인) */}
            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI 생성 결과</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    AI가 생성한 템플릿을 확인하고 다음 단계를 선택하세요
                  </p>

                  {selectedResult && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-semibold">{selectedResult.title}</h4>
                        <span className="text-xs text-gray-500">
                          {selectedResult.generatedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 max-h-64 overflow-auto mb-4">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                          {selectedResult.content}
                        </pre>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedResult.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => {
                        if (selectedResult) {
                          setTemplateData(prev => ({
                            ...prev,
                            title: selectedResult.title,
                            content: selectedResult.content,
                            tags: selectedResult.tags,
                            preview: selectedResult.preview
                          }));
                        }
                        handleNext();
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      이 내용으로 계속하기
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep('generate');
                        setError('');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Wand2 className="w-4 h-4" />
                      다시 생성하기
                    </button>
                    <button
                      onClick={skipToEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <PenTool className="w-4 h-4" />
                      직접 작성하기
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Edit Content */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      제목 *
                    </label>
                    <input
                      type="text"
                      value={templateData.title}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="템플릿 제목을 입력하세요"
                      className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Content */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      내용 *
                    </label>
                    <textarea
                      value={templateData.content}
                      onChange={(e) => setTemplateData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="템플릿 내용을 입력하세요..."
                      className="w-full h-64 p-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {templateData.content.length}자 / 예상: {templateData.estimatedWords}자
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      태그
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {templateData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
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
                        className="flex-1 p-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <button
                        onClick={() => {
                          addTag(tagInput);
                          setTagInput('');
                        }}
                        className="px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm"
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
              </motion.div>
            )}

            {/* Step 5: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-6"
              >
                <div>
                  <h3 className="text-lg font-semibold mb-4">템플릿 최종 확인</h3>

                  {/* Template Preview Card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{templateData.title}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                            {TEMPLATE_CATEGORY_LABELS[templateData.category]}
                          </span>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                            {TEMPLATE_DIFFICULTY_LABELS[templateData.difficulty]}
                          </span>
                          <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                            {TEMPLATE_TONE_LABELS[templateData.tone]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">내용 미리보기:</p>
                      <div className="bg-white border border-gray-200 rounded-md p-4 max-h-64 overflow-auto">
                        <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                          {templateData.content}
                        </pre>
                      </div>
                    </div>

                    {templateData.tags.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">태그:</p>
                        <div className="flex flex-wrap gap-1">
                          {templateData.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-gray-500">
                      예상 글자 수: {templateData.estimatedWords}자 / 실제: {templateData.content.length}자
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer with Navigation */}
        <div className="flex items-center justify-between p-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            {currentStep !== 'basic' && (
              <button
                onClick={handlePrevious}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                이전
              </button>
            )}

            {currentStep === 'generate' && (
              <button
                onClick={skipToEdit}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                AI 건너뛰고 직접 작성
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 'generate' && (
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
                    <Zap className="w-4 h-4" />
                    AI로 생성하기
                  </>
                )}
              </button>
            )}

            {currentStep === 'preview' ? (
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
            ) : currentStep !== 'generate' && currentStep !== 'review' && (
              <button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentStep === 'edit' ? '미리보기' : '다음'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Help
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-400">
            단축키: Ctrl+Enter (다음), Esc ({currentStep === 'basic' ? '닫기' : '이전'})
          </p>
        </div> */}
      </motion.div>
    </div>
  );
}