'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  SpeechRecognitionHook,
  SpeechRecognitionState,
  SpeechRecognitionConfig,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent
} from '@/lib/speech/types';
import {
  DEFAULT_SPEECH_CONFIG,
  isSpeechRecognitionSupported,
  getSpeechRecognition,
  mapSpeechRecognitionError,
  getErrorMessage,
  processVoiceCommand,
  cleanTranscript,
  requestMicrophonePermission
} from '@/lib/speech/utils';

interface UseSpeechRecognitionOptions {
  config?: Partial<SpeechRecognitionConfig>;
  onResult?: (transcript: string, isInterim: boolean) => void;
  onCommand?: (action: string) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const {
    config = {},
    onResult,
    onCommand,
    onError
  } = options;

  const finalConfig = { ...DEFAULT_SPEECH_CONFIG, ...config };
  
  // State management
  const [state, setState] = useState<SpeechRecognitionState>({
    isListening: false,
    isSupported: false,
    transcript: '',
    interimTranscript: '',
    finalTranscript: '',
    confidence: 0,
    error: null,
    hasPermission: null
  });

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = isSpeechRecognitionSupported();
    setState(prev => ({ ...prev, isSupported }));

    if (!isSupported) {
      setState(prev => ({ 
        ...prev, 
        error: getErrorMessage('browser-not-supported') 
      }));
      return;
    }

    const SpeechRecognitionConstructor = getSpeechRecognition();
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    
    // Configure recognition
    recognition.lang = finalConfig.language;
    recognition.continuous = finalConfig.continuous;
    recognition.interimResults = finalConfig.interimResults;
    recognition.maxAlternatives = finalConfig.maxAlternatives;

    // Event handlers
    recognition.onstart = () => {
      setState(prev => ({ 
        ...prev, 
        isListening: true, 
        error: null,
        hasPermission: true
      }));
      isListeningRef.current = true;
    };

    recognition.onend = () => {
      setState(prev => ({ ...prev, isListening: false }));
      isListeningRef.current = false;

      // Auto-restart if we were listening and no error occurred
      if (isListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.error('Failed to restart recognition:', err);
            }
          }
        }, 100);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorType = mapSpeechRecognitionError(event.error);
      const errorMessage = getErrorMessage(errorType);
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        isListening: false,
        hasPermission: errorType === 'not-allowed' ? false : prev.hasPermission
      }));
      
      isListeningRef.current = false;
      onError?.(errorMessage);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let confidence = 0;

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        confidence = Math.max(confidence, result[0].confidence || 0);

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      // Process voice commands for final results
      if (finalTranscript) {
        const { isCommand, action, cleanText } = processVoiceCommand(finalTranscript);
        
        if (isCommand && action) {
          onCommand?.(action);
          return; // Don't add command text to transcript
        } else {
          const cleaned = cleanTranscript(cleanText);
          setState(prev => ({
            ...prev,
            finalTranscript: prev.finalTranscript + cleaned,
            transcript: prev.finalTranscript + cleaned,
            confidence,
            interimTranscript: ''
          }));
          onResult?.(cleaned, false);
        }
      } else if (interimTranscript) {
        // Update interim results
        const cleaned = cleanTranscript(interimTranscript);
        setState(prev => ({
          ...prev,
          interimTranscript: cleaned,
          transcript: prev.finalTranscript + cleaned,
          confidence
        }));
        onResult?.(cleaned, true);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, [finalConfig.language, finalConfig.continuous, finalConfig.interimResults, finalConfig.maxAlternatives, onCommand, onError, onResult, state.error]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const hasPermission = await requestMicrophonePermission();
      setState(prev => ({ ...prev, hasPermission }));
      return hasPermission;
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        hasPermission: false,
        error: getErrorMessage('permission-denied')
      }));
      return false;
    }
  }, []);

  // Start listening
  const startListening = useCallback(async () => {
    if (!recognitionRef.current || state.isListening) return;

    // Check permission first
    if (state.hasPermission !== true) {
      const permitted = await requestPermission();
      if (!permitted) return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));
      isListeningRef.current = true;
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setState(prev => ({ 
        ...prev, 
        error: '음성 인식을 시작할 수 없습니다.',
        isListening: false
      }));
      isListeningRef.current = false;
    }
  }, [state.isListening, state.hasPermission, requestPermission]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
    }
    
    isListeningRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Failed to stop recognition:', err);
      }
    }
    
    setState(prev => ({ ...prev, isListening: false }));
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setState(prev => ({
      ...prev,
      transcript: '',
      interimTranscript: '',
      finalTranscript: '',
      confidence: 0,
      error: null
    }));
  }, []);

  // Removed unused debounced result handler

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
    requestPermission
  };
}