'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Heart,
  Briefcase,
  Coffee,
  Sparkles,
  Type,
  ArrowUp,
  ArrowDown,
  Search,
  Loader2,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  generateText,
  improveText,
  changeTone,
  expandText,
  summarizeText,
  getSelectedText,
  insertOrReplaceText,
  getCurrentParagraphText
} from '@/lib/ai/services';
import { Editor } from '@tiptap/core';

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  category: 'templates' | 'ai' | 'formatting';
  action: (editor?: Editor) => void | Promise<void>;
  requiresSelection?: boolean;
  requiresText?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand: (command: Command) => void;
  position?: { x: number; y: number };
  editor?: Editor;
}

// Template content lookup
const getTemplateContent = (commandId: string): string => {
  const templates: Record<string, string> = {
    'business-email': `<h3>제목: [메일 제목을 입력하세요]</h3><p>[받는 분 성함] 님,</p><p>안녕하세요. 평소 업무에 수고가 많으시겠습니다.</p><p>이번에 [업무 내용/요청 사항]에 대해 연락드립니다...</p><p>감사합니다.<br>[보내는 이 성명]</p>`,
    'personal-letter': `<p>[이름]님께,</p><p>안녕하세요? 오랜만에 안부 전합니다.</p><p>요즘 어떻게 지내시는지 궁금하여 이렇게 편지를 쓰게 되었습니다...</p><p>건강하시길 바라며,<br>[보내는 이]</p>`,
    'thank-you': `<p>[성함]님께,</p><p>지난번 [구체적인 도움 내용]에 대해 진심으로 감사드립니다.</p><p>덕분에 [결과/도움이 된 점]할 수 있었고, 정말 큰 힘이 되었습니다...</p><p>다시 한번 감사드리며,<br>[성명]</p>`,
    'apology-message': `<p>[성함]님께,</p><p>먼저 [사건/상황]에 대해 진심으로 사과드립니다.</p><p>제가 [잘못한 점/부족했던 부분]으로 인해 불편을 끼쳐드려 죄송합니다...</p><p>앞으로는 이런 일이 없도록 더욱 신경 쓰겠습니다.<br>죄송합니다.<br><br>[성명]</p>`,
    'casual-message': `<p>[이름]아/야!</p><p>안녕? 잘 지내고 있지?</p><p>오늘 [이유/상황] 때문에 연락하게 되었어...</p><p>시간 날 때 연락해!<br>[이름]</p>`
  };
  return templates[commandId] || '';
};

const commands: Command[] = [
  // Template Commands
  {
    id: 'business-email',
    label: '업무용 이메일',
    description: '정중하고 전문적인 업무 이메일',
    icon: Mail,
    category: 'templates',
    action: (editor) => {
      if (editor) {
        const content = getTemplateContent('business-email');
        insertOrReplaceText(editor, content);
      }
    }
  },
  {
    id: 'personal-letter',
    label: '개인 편지',
    description: '따뜻하고 정성 어린 개인 편지',
    icon: MessageSquare,
    category: 'templates',
    action: (editor) => {
      if (editor) {
        const content = getTemplateContent('personal-letter');
        insertOrReplaceText(editor, content);
      }
    }
  },
  {
    id: 'thank-you',
    label: '감사 인사말',
    description: '마음이 담긴 감사 표현',
    icon: Heart,
    category: 'templates',
    action: (editor) => {
      if (editor) {
        const content = getTemplateContent('thank-you');
        insertOrReplaceText(editor, content);
      }
    }
  },
  {
    id: 'apology-message',
    label: '사과 메시지',
    description: '진심 어린 사과와 양해 구하기',
    icon: Briefcase,
    category: 'templates',
    action: (editor) => {
      if (editor) {
        const content = getTemplateContent('apology-message');
        insertOrReplaceText(editor, content);
      }
    }
  },
  {
    id: 'casual-message',
    label: '친근한 메시지',
    description: '편안하고 친밀한 일상 메시지',
    icon: Coffee,
    category: 'templates',
    action: (editor) => {
      if (editor) {
        const content = getTemplateContent('casual-message');
        insertOrReplaceText(editor, content);
      }
    }
  },

  // AI Commands
  {
    id: 'improve-writing',
    label: '글 다듬기',
    description: '명확성과 자연스러운 흐름으로 개선',
    icon: Sparkles,
    category: 'ai',
    requiresText: true,
    action: async (editor) => {
      if (!editor) return;

      const selectedText = getSelectedText(editor);
      if (!selectedText || selectedText.trim().length === 0) {
        alert('개선할 텍스트를 선택하거나 작성해주세요.');
        return;
      }

      try {
        const result = await improveText({
          text: selectedText,
          improvements: ['문법 개선', '자연스러운 표현', '명확성 개선'],
          tone: 'professional'
        });

        if (result.success && result.content) {
          insertOrReplaceText(editor, result.content, true);
        } else {
          alert(result.error || '텍스트 개선에 실패했습니다.');
        }
      } catch (error) {
        console.error('텍스트 개선 오류:', error);
        alert('텍스트 개선 중 오류가 발생했습니다.');
      }
    }
  },
  {
    id: 'change-tone-formal',
    label: '정중한 톤으로 변경',
    description: '격식 있고 정중한 표현으로 변경',
    icon: Type,
    category: 'ai',
    requiresText: true,
    action: async (editor) => {
      if (!editor) return;

      const selectedText = getSelectedText(editor);
      if (!selectedText || selectedText.trim().length === 0) {
        alert('톤을 변경할 텍스트를 선택하거나 작성해주세요.');
        return;
      }

      try {
        const result = await changeTone({
          text: selectedText,
          currentTone: 'casual',
          targetTone: 'formal'
        });

        if (result.success && result.content) {
          insertOrReplaceText(editor, result.content, true);
        } else {
          alert(result.error || '톤 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('톤 변경 오류:', error);
        alert('톤 변경 중 오류가 발생했습니다.');
      }
    }
  },
  {
    id: 'change-tone-friendly',
    label: '친근한 톤으로 변경',
    description: '따뜻하고 친근한 표현으로 변경',
    icon: Heart,
    category: 'ai',
    requiresText: true,
    action: async (editor) => {
      if (!editor) return;

      const selectedText = getSelectedText(editor);
      if (!selectedText || selectedText.trim().length === 0) {
        alert('톤을 변경할 텍스트를 선택하거나 작성해주세요.');
        return;
      }

      try {
        const result = await changeTone({
          text: selectedText,
          currentTone: 'formal',
          targetTone: 'friendly'
        });

        if (result.success && result.content) {
          insertOrReplaceText(editor, result.content, true);
        } else {
          alert(result.error || '톤 변경에 실패했습니다.');
        }
      } catch (error) {
        console.error('톤 변경 오류:', error);
        alert('톤 변경 중 오류가 발생했습니다.');
      }
    }
  },
  {
    id: 'expand-text',
    label: '내용 확장',
    description: '더 상세한 설명과 맥락 추가',
    icon: ArrowUp,
    category: 'ai',
    requiresText: true,
    action: async (editor) => {
      if (!editor) return;

      const selectedText = getSelectedText(editor);
      if (!selectedText || selectedText.trim().length === 0) {
        alert('확장할 텍스트를 선택하거나 작성해주세요.');
        return;
      }

      try {
        const result = await expandText({
          text: selectedText,
          expansionType: 'detail',
          length: 'medium',
          tone: 'professional'
        });

        if (result.success && result.content) {
          insertOrReplaceText(editor, result.content, true);
        } else {
          alert(result.error || '텍스트 확장에 실패했습니다.');
        }
      } catch (error) {
        console.error('텍스트 확장 오류:', error);
        alert('텍스트 확장 중 오류가 발생했습니다.');
      }
    }
  },
  {
    id: 'summarize',
    label: '요약하기',
    description: '핵심 내용을 간결하게 정리',
    icon: ArrowDown,
    category: 'ai',
    requiresText: true,
    action: async (editor) => {
      if (!editor) return;

      const selectedText = getSelectedText(editor);
      if (!selectedText || selectedText.trim().length === 0) {
        alert('요약할 텍스트를 선택하거나 작성해주세요.');
        return;
      }

      if (selectedText.length < 100) {
        alert('요약하기에는 텍스트가 너무 짧습니다. (최소 100자)');
        return;
      }

      try {
        const result = await summarizeText({
          text: selectedText,
          length: 'medium',
          tone: 'professional'
        });

        if (result.success && result.content) {
          insertOrReplaceText(editor, result.content, true);
        } else {
          alert(result.error || '텍스트 요약에 실패했습니다.');
        }
      } catch (error) {
        console.error('텍스트 요약 오류:', error);
        alert('텍스트 요약 중 오류가 발생했습니다.');
      }
    }
  },
  {
    id: 'generate-content',
    label: 'AI로 내용 생성',
    description: '주제를 입력하면 AI가 내용을 작성해드립니다',
    icon: Zap,
    category: 'ai',
    action: async (editor) => {
      if (!editor) return;

      const prompt = window.prompt('어떤 내용을 작성하고 싶으신가요?\n(예: "회사 팀워크의 중요성에 대한 글")');
      if (!prompt || prompt.trim().length === 0) return;

      try {
        const result = await generateText({
          prompt: prompt.trim(),
          type: 'business-email',
          tone: 'professional',
          length: 'medium'
        });

        if (result.success && result.content) {
          insertOrReplaceText(editor, result.content);
        } else {
          alert(result.error || '내용 생성에 실패했습니다.');
        }
      } catch (error) {
        console.error('내용 생성 오류:', error);
        alert('내용 생성 중 오류가 발생했습니다.');
      }
    }
  }
];

export default function CommandPalette({
  isOpen,
  onClose,
  onCommand,
  position = { x: 0, y: 0 },
  editor
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredCommands, setFilteredCommands] = useState(commands);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCommandSelect = useCallback(async (command: Command) => {
    try {
      setIsLoading(true);

      // AI 명령어인 경우 비동기 처리
      if (command.category === 'ai') {
        await command.action(editor);
      } else {
        // 템플릿 명령어는 동기 처리
        command.action(editor);
      }

      onCommand(command);
      onClose();
      setSearchQuery('');
    } catch (error) {
      console.error('명령어 실행 오류:', error);
      alert('명령어 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [onCommand, onClose, editor]);

  // Filter commands based on search query
  useEffect(() => {
    const filtered = commands.filter(command =>
      command.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      command.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCommands(filtered);
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onClose, handleCommandSelect]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'templates': return '📝';
      case 'ai': return '✨';
      case 'formatting': return '🎨';
      default: return '⚡';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'templates': return 'text-blue-500';
      case 'ai': return 'text-purple-500';
      case 'formatting': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="fixed z-50 w-96 bg-card bg-white border border-border rounded-lg shadow-2xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 400),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-border bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              placeholder="명령어 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <p>명령어를 찾을 수 없습니다</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredCommands.map((command, index) => {
                const Icon = command.icon;
                return (
                  <motion.button
                    key={command.id}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                    onClick={() => handleCommandSelect(command)}
                    disabled={isLoading}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50',
                      isLoading && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      getCategoryColor(command.category),
                      index === selectedIndex ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      {isLoading && index === selectedIndex ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {command.label}
                        </span>
                        <span className="text-xs">
                          {getCategoryIcon(command.category)}
                        </span>
                        {command.requiresText && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">
                            텍스트 필요
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {command.description}
                      </p>
                    </div>

                    {index === selectedIndex && !isLoading && (
                      <div className="text-xs text-muted-foreground">
                        ↵
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>↑↓ 탐색</span>
              <span>↵ 선택</span>
              <span>Esc 닫기</span>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}