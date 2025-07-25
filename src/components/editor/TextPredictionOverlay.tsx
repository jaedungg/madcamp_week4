'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Editor } from '@tiptap/core';
import { cn } from '@/lib/utils';
import type { PredictionContext } from '@/lib/ai/types';
import { createPortal } from 'react-dom';

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
  lineHeight: number;
  editorWidth: number;
  availableWidth: number;
  characterWidth: number;
  paddingLeft: number;
}

interface PredictionLine {
  text: string;
  x: number;
  y: number;
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
  const measureRef = useRef<HTMLDivElement>(null);
  const characterWidthCache = useRef<Map<string, number>>(new Map());
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 문자 평균 너비 측정 (캐싱 포함)
   */
  const measureCharacterWidth = useCallback((sampleText?: string): number => {
    const cacheKey = 'default';
    const cached = characterWidthCache.current.get(cacheKey);

    if (cached) {
      return cached;
    }

    if (!measureRef.current || !editor) {
      return 8; // 기본 fallback 값
    }

    // 측정용 샘플 텍스트 (한글, 영어 혼합)
    const testText = sampleText || '가나다라마바사아자차카타파하ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    // 임시 요소 생성하여 너비 측정
    measureRef.current.textContent = testText;
    measureRef.current.style.visibility = 'hidden';
    measureRef.current.style.position = 'absolute';
    measureRef.current.style.whiteSpace = 'nowrap';

    const width = measureRef.current.getBoundingClientRect().width;
    const avgWidth = width / testText.length;

    // 캐시에 저장
    characterWidthCache.current.set(cacheKey, avgWidth);

    return avgWidth;
  }, [editor]);

  /**
   * 에디터 박스에서 사용 가능한 너비 계산
   */
  const calculateAvailableWidth = useCallback((editorRect: DOMRect, cursorX: number): number => {
    const editorWidth = editorRect.width;
    const padding = 48; // 에디터 좌우 패딩 (p-6 = 24px * 2)
    const margin = 20; // 여유 공간

    const contentWidth = editorWidth - padding;
    const availableFromCursor = contentWidth - cursorX - margin;

    // 최소 너비 보장 (너무 좁으면 전체 너비의 30% 사용)
    const minWidth = contentWidth * 0.3;

    return Math.max(availableFromCursor, minWidth);
  }, []);

  /**
   * 커서 위치 계산 (확장된 정보 포함)
   */
  const calculateCursorPosition = useCallback((): CursorPosition | null => {
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

      // 줄 높이 계산 (에디터의 line-height 기반)
      const computedStyle = window.getComputedStyle(view.dom);
      const lineHeight = parseFloat(computedStyle.lineHeight) || height * 1.6;

      // 패딩 정보
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 24;

      // 에디터 너비 정보
      const editorWidth = editorRect.width;
      const availableWidth = calculateAvailableWidth(editorRect, x);
      const characterWidth = measureCharacterWidth();

      return {
        x,
        y,
        height,
        lineHeight,
        editorWidth,
        availableWidth,
        characterWidth,
        paddingLeft
      };
    } catch (error) {
      console.error('Error calculating cursor position:', error);
      return null;
    }
  }, [editor, context, measureCharacterWidth, calculateAvailableWidth]);


  /**
   * 위치 업데이트 함수
   */
  const updatePosition = useCallback(() => {
    const position = calculateCursorPosition();
    setCursorPosition(position);
  }, [calculateCursorPosition]);

  /**
   * 리사이즈 핸들러
   */
  const handleResize = useCallback(() => {
    // 캐시 클리어 (리사이즈 시 문자 너비가 변경될 수 있음)
    characterWidthCache.current.clear();
    updatePosition();
  }, [updatePosition]);

  /**
   * 디바운스된 리사이즈 핸들러
   */
  const debouncedResize = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }
    resizeTimeoutRef.current = setTimeout(handleResize, 100);
  }, [handleResize]);

  /**
   * 커서 위치 업데이트
   */
  useEffect(() => {
    if (!isVisible || !editor || !context) {
      setCursorPosition(null);
      return;
    }

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

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('scroll', debouncedResize);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('scroll', debouncedResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [editor, context, isVisible, updatePosition, debouncedResize]);

  /**
   * 예측 텍스트를 멀티라인으로 분할하여 위치 정보와 함께 반환
   */
  const formatPredictionText = useCallback((text: string, cursorPosition: CursorPosition): PredictionLine[] => {
    if (!text || !cursorPosition) return [];

    const {
      x: cursorX,
      y: cursorY,
      lineHeight,
      editorWidth,
      characterWidth,
      paddingLeft
    } = cursorPosition;


    // 첫 번째 줄: 커서부터 줄 끝까지 사용 가능한 길이
    //const paddingRight = paddingLeft; // 대칭적인 패딩 가정
    //const firstLineAvailableWidth = editorWidth - cursorX - paddingRight;
    //const firstLineMaxLength = Math.max(5, Math.floor(firstLineAvailableWidth / characterWidth * 0.9));
    const firstLineMaxLength = Math.floor(cursorPosition.availableWidth / characterWidth);

    // 다음 줄들: 전체 너비 사용 가능
    //const nextLineAvailableWidth = editorWidth - paddingLeft - paddingRight;
    const nextLineAvailableWidth = cursorPosition.editorWidth - paddingLeft * 2;
    //const nextLineMaxLength = Math.max(10, Math.floor(nextLineAvailableWidth / characterWidth * 0.9));
    const nextLineMaxLength = Math.floor(nextLineAvailableWidth / characterWidth);

    const lines: PredictionLine[] = [];
    let remainingText = text.trim();
    let lineIndex = 0;

    while (remainingText && lineIndex < 3) {
      const maxLength = lineIndex === 0 ? firstLineMaxLength : nextLineMaxLength;
      const lineX = lineIndex === 0 ? cursorX : paddingLeft;
      const lineY = cursorY + (lineIndex * lineHeight);

      let lineText = '';
      let currentLength = 0;
      let lastSpaceIndex = -1;

      // 단어 경계를 고려한 텍스트 분할
      for (let i = 0; i < remainingText.length; i++) {
        const char = remainingText[i];
        const charLength = /[가-힣]/.test(char) ? 2 : 1;

        // 공백 위치 기록
        if (char === ' ') {
          lastSpaceIndex = i;
        }

        // 현재 문자를 추가했을 때 길이 확인
        if (currentLength + charLength <= maxLength) {
          lineText += char;
          currentLength += charLength;
        } else {
          // 길이 초과 시 처리
          if (lastSpaceIndex > 0) {
            // 마지막 공백에서 자르기 (단어 경계 유지)
            lineText = remainingText.substring(0, lastSpaceIndex);
            remainingText = remainingText.substring(lastSpaceIndex + 1);
          } else if (lineText.length > 0) {
            // 단어 경계가 없으면 현재 위치에서 자르기
            remainingText = remainingText.substring(lineText.length);
          } else {
            // 최소 1글자는 포함
            lineText = char;
            remainingText = remainingText.substring(1);
          }
          break;
        }

        // 마지막 문자까지 처리된 경우
        if (i === remainingText.length - 1) {
          remainingText = '';
        }
      }

      if (lineText.trim()) {
        lines.push({
          text: lineText.trim(),
          x: lineX,
          y: lineY
        });
      }

      lineIndex++;
    }

    return lines;
  }, []);

  const predictionLines = useMemo(() => {
    if (!isVisible || !prediction || !cursorPosition) {
      return [];
    }
    return formatPredictionText(prediction, cursorPosition);
  }, [isVisible, prediction, cursorPosition, formatPredictionText]);

  if (!isVisible || !prediction || !cursorPosition) {
    return null;
  }

  return (
    <>
      {/* 문자 너비 측정용 숨겨진 요소 */}
      <div
        ref={measureRef}
        className={cn(
          'prose prose-neutral dark:prose-invert max-w-none',
          'font-mono text-sm leading-relaxed'
        )}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Menlo", monospace, "Noto Sans KR", sans-serif',
        }}
        aria-hidden="true"
      />

      <AnimatePresence>
        {predictionLines.map((line, index) => (
          <motion.div
            key={index}
            ref={index === 0 ? overlayRef : undefined}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 0.5, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              delay: index * 0.05,
              ease: 'easeOut'
            }}
            className={cn(
              'absolute pointer-events-none select-none z-10',
              'text-muted-foreground/60 whitespace-pre-wrap font-mono text-sm leading-relaxed',
              // TipTap 에디터와 동일한 폰트 스타일링
              'prose prose-neutral dark:prose-invert max-w-none',
              // 배경과 구분되도록 약간의 그림자 효과
              'drop-shadow-sm',
              className
            )}
            style={{
              left: line.x,
              top: line.y,
              // 에디터와 동일한 라인 높이 유지
              lineHeight: cursorPosition.lineHeight + 'px',
              // 한글 폰트 최적화
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Menlo", monospace, "Noto Sans KR", sans-serif',
            }}
          >
            {line.text}

            {/* 예측 사용 힌트 (첫 번째 줄에만 표시) */}
            {index === 0 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.4, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 }}
                className="absolute left-full ml-2 top-0 text-xs text-muted-foreground/40 bg-background/80 px-2 py-1 rounded border border-border/20 backdrop-blur-sm whitespace-nowrap"
              >
                Tab
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </>
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
  return createPortal(
    <TextPredictionOverlay {...props} />,
    editorContainer
  );
}