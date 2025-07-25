'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { motion } from 'framer-motion';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CommandPalette from './CommandPalette';
import SpeechRecognitionButton from './SpeechRecognitionButton';
import TextPredictionOverlay from './TextPredictionOverlay';
import PredictionToggle from './PredictionToggle';
import { useTextPrediction } from '@/hooks/useTextPrediction';
import { usePredictionEnabled, useTogglePrediction } from '@/stores/settingsStore';
import { Editor } from '@tiptap/core';

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive,
  disabled,
  children,
  title
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-2 rounded-lg transition-colors',
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent',
      disabled && 'opacity-50 cursor-not-allowed'
    )}
  >
    {children}
  </motion.button>
);

interface AIEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  onPredictionError?: (error: string) => void;
}

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

export default function AIEditor({
  content = '',
  onChange,
  placeholder = "글을 작성하거나 '/'를 입력해 AI 명령어를 사용하세요",
  className,
  onPredictionError
}: AIEditorProps) {
  // store에서 예측 설정 가져오기
  const enablePrediction = usePredictionEnabled();
  const togglePrediction = useTogglePrediction();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ x: 0, y: 0 });
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const handleSlashCommand = useCallback(() => {
    // Get current cursor position for command palette placement
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setCommandPalettePosition({
        x: rect.left,
        y: rect.bottom + 10
      });
    }
    setShowCommandPalette(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    content: content,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-neutral dark:prose-invert max-w-none',
          'min-h-[500px] w-full p-6 rounded-lg border border-border bg-background',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          'text-foreground placeholder:text-muted-foreground',
          className
        ),
      },
      handleKeyDown: (view, event) => {
        // Detect "/" key to trigger command palette
        if (event.key === '/') {
          // Small delay to allow the "/" character to be inserted first
          setTimeout(() => {
            handleSlashCommand();
          }, 0);
        }
        return false; // Let the event continue
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    immediatelyRender: false,
  }, [handleSlashCommand]);

  // 텍스트 예측 훅 사용
  const prediction = useTextPrediction(editor, {
    enabled: enablePrediction,
    onError: onPredictionError
  });

  // 키보드 이벤트 처리를 위한 useEffect
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Tab 키로 예측 텍스트 적용
      if (event.key === 'Tab' && prediction.isVisible) {
        event.preventDefault();
        prediction.applyPrediction();
        return;
      }

      // Escape 키로 예측 텍스트 취소
      if (event.key === 'Escape' && prediction.isVisible) {
        event.preventDefault();
        prediction.clearPrediction();
        return;
      }

      // 다른 키 입력 시 예측 텍스트 지우기 (방향키, 수정키는 제외)
      const preserveKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'Control', 'Alt', 'Meta', 'Tab', 'Escape'];
      if (!preserveKeys.includes(event.key) && prediction.isVisible) {
        // 약간의 지연을 두어 키 입력이 처리된 후 예측 지우기
        setTimeout(() => {
          prediction.clearPrediction();
        }, 0);
      }
    };

    // 에디터 DOM에 키보드 이벤트 리스너 추가
    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor, prediction]);

  // 전역 키보드 단축키 처리 (Ctrl+Shift+P로 예측 토글)
  useEffect(() => {
    const handleGlobalKeydown = (event: KeyboardEvent) => {
      // Ctrl+Shift+P로 예측 토글
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        togglePrediction();
        
        // 간단한 시각적 피드백
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    };

    // 전역 이벤트 리스너 등록
    document.addEventListener('keydown', handleGlobalKeydown);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeydown);
    };
  }, [togglePrediction]);

  const handleCommandSelect = useCallback((_command: Command) => {
    if (editor) {
      // Remove the "/" character that triggered the command
      const { from } = editor.state.selection;
      editor.chain().focus().deleteRange({ from: from - 1, to: from }).run();
    }
    setShowCommandPalette(false);
  }, [editor]);


  if (!editor) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-muted rounded-lg mb-4"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-card border border-border rounded-lg">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists & Quote */}
        <div className="flex items-center gap-1 pr-2 border-r border-border">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Speech Recognition & AI Buttons */}
        <div className="ml-auto flex items-center gap-2">
          <SpeechRecognitionButton
            editor={editor}
            onTranscriptChange={(transcript, isInterim) => {
              // Handle transcript changes if needed
              console.log('Transcript:', transcript, 'Interim:', isInterim);
            }}
          />

          {/* AI 예측 토글 버튼 */}
          <PredictionToggle />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
            onClick={() => {
              // TODO: Implement AI command palette
              console.log('AI command palette triggered');
            }}
          >
            <Type className="w-4 h-4" />
            <span className="text-sm">AI</span>
          </motion.button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative" ref={editorContainerRef}>
        <EditorContent
          editor={editor}
          placeholder={placeholder}
        />

        {/* Placeholder when empty */}
        {editor.isEmpty && (
          <div className="absolute top-6 left-6 text-muted-foreground pointer-events-none">
            {placeholder}
          </div>
        )}

        {/* Text Prediction Overlay */}
        {enablePrediction && (
          <TextPredictionOverlay
            editor={editor}
            prediction={prediction.prediction}
            context={prediction.context}
            isVisible={prediction.isVisible}
            className="absolute inset-0"
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-4">
          <span>
            {editor.storage.characterCount?.characters() || 0}자
          </span>
          <span>
            {editor.storage.characterCount?.words() || 0}단어
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>&apos;/&apos;를 입력해 AI 명령어 사용</span>
          <span>•</span>
          <span 
            className="flex items-center gap-1 cursor-help" 
            title="Ctrl+Shift+P로 토글 가능"
          >
            <Zap className={cn(
              "w-3 h-3 transition-colors",
              enablePrediction ? "text-blue-500" : "text-muted-foreground"
            )} />
            {enablePrediction ? (
              prediction.isLoading ? '예측 중...' :
              prediction.isVisible ? 'Tab으로 적용' :
              'AI 예측 활성'
            ) : (
              'AI 예측 비활성'
            )}
          </span>
        </div>
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommandSelect}
        position={commandPalettePosition}
        editor={editor}
      />
    </div>
  );
}