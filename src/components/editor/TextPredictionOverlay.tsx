'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import type { PredictionContext } from '@/lib/ai/types';

interface TextPredictionOverlayProps {
  editor: Editor | null;
  prediction: string;
  context: PredictionContext | null;
  isVisible: boolean;
  className?: string;
}

interface CursorPosition {
  x: number;
  y: number;
  height: number;
}

/**
 * 텍스트 예측 미리보기 오버레이 컴포넌트
 */
export default function TextPredictionOverlay({
  editor,
  prediction,
  context,
  isVisible,
  className
}: TextPredictionOverlayProps) {
  const [cursorPosition, setCursorPosition] = useState<CursorPosition | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /**
   * 커서 위치 계산
   */
  const calculateCursorPosition = (): CursorPosition | null => {
    if (!editor || !context) return null;

    try {
      const { view } = editor;
      const { from } = editor.state.selection;
      
      // TipTap 에디터에서 DOM 좌표 얻기
      const coords = view.coordsAtPos(from);
      const editorRect = view.dom.getBoundingClientRect();
      
      // 에디터 컨테이너 기준 상대 좌표
      const x = coords.left - editorRect.left;
      const y = coords.top - editorRect.top;
      const height = coords.bottom - coords.top;

      return { x, y, height };
    } catch (error) {
      console.error('Error calculating cursor position:', error);
      return null;
    }
  };

  /**
   * 커서 위치 업데이트
   */
  useEffect(() => {
    if (!isVisible || !editor || !context) {
      setCursorPosition(null);
      return;
    }

    const updatePosition = () => {
      const position = calculateCursorPosition();
      setCursorPosition(position);
    };

    // 초기 위치 설정
    updatePosition();

    // 에디터 업데이트 시 위치 재계산
    const handleUpdate = () => {
      // 약간의 지연을 두어 DOM 업데이트 후 위치 계산
      setTimeout(updatePosition, 0);
    };

    const handleSelectionUpdate = () => {
      setTimeout(updatePosition, 0);
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleSelectionUpdate);

    // 윈도우 리사이즈 시 위치 재계산
    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [editor, context, isVisible]);

  /**
   * 예측 텍스트를 줄 단위로 분할
   */
  const formatPredictionText = (text: string): string[] => {
    if (!text) return [];
    
    // 긴 예측 텍스트를 적절한 길이로 분할
    const maxLineLength = 50;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxLineLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    // 최대 3줄까지만 표시
    return lines.slice(0, 3);
  };

  if (!isVisible || !prediction || !cursorPosition) {
    return null;
  }

  const textLines = formatPredictionText(prediction);

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={cn(
          'absolute pointer-events-none select-none z-10',
          className
        )}
        style={{
          left: cursorPosition.x,
          top: cursorPosition.y,
          minHeight: cursorPosition.height,
        }}
      >
        {textLines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 0.5, x: 0 }}
            transition={{ 
              duration: 0.2, 
              delay: index * 0.05,
              ease: 'easeOut'
            }}
            className={cn(
              'text-muted-foreground/60 whitespace-pre-wrap font-mono text-sm leading-relaxed',
              // TipTap 에디터와 동일한 폰트 스타일링
              'prose prose-neutral dark:prose-invert max-w-none',
              // 배경과 구분되도록 약간의 그림자 효과
              'drop-shadow-sm'
            )}
            style={{
              // 에디터와 동일한 라인 높이 유지
              lineHeight: '1.6',
              // 한글 폰트 최적화
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Menlo", monospace, "Noto Sans KR", sans-serif',
            }}
          >
            {line}
          </motion.div>
        ))}
        
        {/* 예측 사용 힌트 (첫 번째 줄에만 표시) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="absolute -right-16 top-0 text-xs text-muted-foreground/40 bg-background/80 px-2 py-1 rounded border border-border/20 backdrop-blur-sm"
        >
          Tab
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * 예측 오버레이를 에디터 컨테이너에 포탈로 렌더링하는 래퍼 컴포넌트
 */
interface TextPredictionPortalProps extends TextPredictionOverlayProps {
  editorContainer?: HTMLElement | null;
}

export function TextPredictionPortal({
  editorContainer,
  ...props
}: TextPredictionPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !editorContainer) {
    return null;
  }

  // React Portal을 사용하여 에디터 컨테이너에 직접 렌더링
  return (
    <div className="relative">
      <TextPredictionOverlay {...props} />
    </div>
  );
}