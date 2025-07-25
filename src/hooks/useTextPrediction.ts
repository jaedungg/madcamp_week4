import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/core';
import { predictText } from '@/lib/ai/services';
import type {
  PredictRequest,
  PredictionContext,
  TextPredictionState,
  UseTextPredictionOptions
} from '@/lib/ai/types';
import {
  extractPredictionContext,
  shouldTriggerPrediction,
  processprediction,
  debounce,
  predictionCache
} from '@/lib/ai/prediction';

interface UseTextPredictionReturn extends TextPredictionState {
  triggerPrediction: () => void;
  clearPrediction: () => void;
  applyPrediction: () => void;
  isVisible: boolean;
}

/**
 * 텍스트 예측을 위한 커스텀 훅
 */
export function useTextPrediction(
  editor: Editor | null,
  options: UseTextPredictionOptions = {}
): UseTextPredictionReturn {
  const {
    debounceMs = 400,
    maxLength = 50,
    enabled = true,
    onError
  } = options;

  const [state, setState] = useState<TextPredictionState>({
    prediction: '',
    isLoading: false,
    error: null,
    context: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const lastPredictionRef = useRef<string>('');

  /**
   * 예측 실행 함수
   */
  const executePrediction = useCallback(async (context: PredictionContext) => {
    if (!enabled || !editor) return;

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      context
    }));

    try {
      // 캐시 확인
      const cachedPrediction = predictionCache.get(
        context.textBeforeCursor,
        context.cursorPosition
      );

      if (cachedPrediction) {
        const processedPrediction = processprediction(cachedPrediction, context);
        setState(prev => ({
          ...prev,
          prediction: processedPrediction,
          isLoading: false,
          context
        }));
        lastPredictionRef.current = processedPrediction;
        return;
      }

      // API 호출
      const request: PredictRequest = {
        text: context.textBeforeCursor,
        cursorPosition: context.cursorPosition,
        maxLength
      };

      const result = await predictText(request);

      // 요청이 취소되었는지 확인
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (result.success && result.content) {
        const processedPrediction = processprediction(result.content, context);

        // 캐시에 저장
        predictionCache.set(
          context.textBeforeCursor,
          context.cursorPosition,
          result.content
        );

        setState(prev => ({
          ...prev,
          prediction: processedPrediction,
          isLoading: false,
          error: null,
          context
        }));

        lastPredictionRef.current = processedPrediction;
      } else {
        const errorMessage = result.error || '예측에 실패했습니다.';
        setState(prev => ({
          ...prev,
          prediction: '',
          isLoading: false,
          error: errorMessage,
          context
        }));

        if (onError) {
          onError(errorMessage);
        }
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage = '네트워크 오류가 발생했습니다.';
        setState(prev => ({
          ...prev,
          prediction: '',
          isLoading: false,
          error: errorMessage,
          context
        }));

        if (onError) {
          onError(errorMessage);
        }
      }
    }
  }, [editor, enabled, maxLength, onError]);

  /**
   * 디바운스된 예측 함수
   */
  const debouncedPrediction = useCallback(
    debounce((...args: unknown[]) => {
      executePrediction(args[0] as PredictionContext);
    }, debounceMs),
    [executePrediction, debounceMs]
  );

  /**
   * 예측 트리거 함수
   */
  const triggerPrediction = useCallback(() => {
    if (!editor || !enabled) return;

    const context = extractPredictionContext(editor);
    if (!context) return;

    if (shouldTriggerPrediction(context)) {
      debouncedPrediction(context);
    } else {
      // 조건에 맞지 않으면 예측 지우기
      setState(prev => ({
        ...prev,
        prediction: '',
        isLoading: false,
        error: null,
        context: null
      }));
    }
  }, [editor, enabled, debouncedPrediction]);

  /**
   * 예측 지우기
   */
  const clearPrediction = useCallback(() => {
    // 진행 중인 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState({
      prediction: '',
      isLoading: false,
      error: null,
      context: null
    });

    lastPredictionRef.current = '';
  }, []);

  /**
   * 예측 적용 함수
   */
  const applyPrediction = useCallback(() => {
    if (!editor || !state.prediction || !state.context) return;

    try {
      const { cursorPosition } = state.context;

      // 현재 커서 위치에 예측 텍스트 삽입
      editor
        .chain()
        .focus()
        .setTextSelection(cursorPosition)
        .insertContent(state.prediction)
        .run();

      // 예측 지우기
      clearPrediction();
    } catch (error) {
      console.error('Error applying prediction:', error);
      if (onError) {
        onError('예측 적용 중 오류가 발생했습니다.');
      }
    }
  }, [editor, state.prediction, state.context, clearPrediction, onError]);

  /**
   * 에디터 내용 변화 감지
   */
  useEffect(() => {
    if (!editor || !enabled) return;

    const handleUpdate = () => {
      // 약간의 지연을 두어 에디터 상태가 안정화된 후 예측 시도
      setTimeout(() => {
        triggerPrediction();
      }, 10);
    };

    const handleSelectionUpdate = () => {
      // 선택 영역이 변경되면 예측 지우기
      const { from, to } = editor.state.selection;
      if (from !== to) {
        clearPrediction();
      }
    };

    const handleBlur = () => {
      clearPrediction();
    };

    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleSelectionUpdate);
    editor.on('blur', handleBlur);

    return () => {
      editor.off('update', handleUpdate);
      editor.off('selectionUpdate', handleSelectionUpdate);
      editor.off('blur', handleBlur);
    };
  }, [editor, enabled, triggerPrediction, clearPrediction]);

  /**
   * 컴포넌트 언마운트 시 정리
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  /**
   * 주기적으로 캐시 정리
   */
  useEffect(() => {
    const interval = setInterval(() => {
      predictionCache.cleanup();
    }, 60000); // 1분마다 정리

    return () => clearInterval(interval);
  }, []);

  /**
   * 예측이 표시되어야 하는지 판단
   */
  const isVisible = !!(
    state.prediction &&
    !state.isLoading &&
    !state.error &&
    state.context &&
    enabled
  );

  return {
    ...state,
    triggerPrediction,
    clearPrediction,
    applyPrediction,
    isVisible
  };
}