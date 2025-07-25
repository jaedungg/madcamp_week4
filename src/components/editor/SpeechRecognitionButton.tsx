'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  AlertCircle, 
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Editor } from '@tiptap/core';

interface SpeechRecognitionButtonProps {
  editor?: Editor;
  className?: string;
  onTranscriptChange?: (transcript: string, isInterim: boolean) => void;
}

export default function SpeechRecognitionButton({ 
  editor, 
  className,
  onTranscriptChange 
}: SpeechRecognitionButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Handle voice commands that affect the editor
  const handleCommand = useCallback((action: string) => {
    if (!editor) return;

    switch (action) {
      case '.':
      case ',':
      case '?':
      case '!':
        editor.chain().focus().insertContent(action + ' ').run();
        break;
      case '\n':
        editor.chain().focus().insertContent('<br>').run();
        break;
      case 'delete-word':
        // Delete the last word
        const { from } = editor.state.selection;
        const beforeCursor = editor.state.doc.textBetween(0, from, ' ');
        const words = beforeCursor.trim().split(/\s+/);
        if (words.length > 0) {
          const lastWordLength = words[words.length - 1].length;
          editor.chain().focus().deleteRange({ 
            from: from - lastWordLength - 1, 
            to: from 
          }).run();
        }
        break;
      case 'delete-all':
        editor.chain().focus().clearContent().run();
        break;
      case 'undo':
        editor.chain().focus().undo().run();
        break;
      case 'redo':
        editor.chain().focus().redo().run();
        break;
    }
  }, [editor]);

  // Handle transcript results
  const handleResult = useCallback((transcript: string, isInterim: boolean) => {
    if (!editor || !transcript.trim()) return;

    if (!isInterim) {
      // Insert final transcript
      editor.chain().focus().insertContent(transcript + ' ').run();
    }
    
    onTranscriptChange?.(transcript, isInterim);
  }, [editor, onTranscriptChange]);

  // Handle errors
  const handleError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
    // Could show toast notification here
  }, []);

  const {
    isListening,
    isSupported,
    error,
    hasPermission,
    confidence,
    startListening,
    stopListening,
    requestPermission
  } = useSpeechRecognition({
    onResult: handleResult,
    onCommand: handleCommand,
    onError: handleError
  });

  // Handle button click
  const handleClick = useCallback(async () => {
    if (!isSupported) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 3000);
      return;
    }

    if (hasPermission === false) {
      setShowPermissionDialog(true);
      return;
    }

    if (hasPermission === null) {
      const granted = await requestPermission();
      if (!granted) {
        setShowPermissionDialog(true);
        return;
      }
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isSupported, hasPermission, isListening, startListening, stopListening, requestPermission]);

  // Get button state and styling
  const getButtonState = () => {
    if (!isSupported) return 'unsupported';
    if (hasPermission === false) return 'permission-denied';
    if (error) return 'error';
    if (isListening) return 'listening';
    return 'ready';
  };

  const buttonState = getButtonState();

  // Button styling based on state
  const getButtonStyles = () => {
    switch (buttonState) {
      case 'listening':
        return 'bg-red-500 text-white hover:bg-red-600 shadow-lg';
      case 'error':
        return 'bg-red-100 text-red-600 hover:bg-red-200';
      case 'permission-denied':
        return 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200';
      case 'unsupported':
        return 'bg-gray-100 text-gray-400 cursor-not-allowed';
      default:
        return 'text-muted-foreground hover:text-foreground hover:bg-accent';
    }
  };

  // Get appropriate icon
  const getIcon = () => {
    switch (buttonState) {
      case 'listening':
        return <Volume2 className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'permission-denied':
        return <Shield className="w-4 h-4" />;
      case 'unsupported':
        return <MicOff className="w-4 h-4" />;
      default:
        return <Mic className="w-4 h-4" />;
    }
  };

  // Get tooltip text
  const getTooltipText = () => {
    switch (buttonState) {
      case 'listening':
        return `음성 인식 중 (${Math.round(confidence * 100)}%)`;
      case 'error':
        return error || '음성 인식 오류';
      case 'permission-denied':
        return '마이크 권한이 필요합니다';
      case 'unsupported':
        return '이 브라우저는 음성 인식을 지원하지 않습니다';
      default:
        return '음성으로 텍스트 입력';
    }
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: buttonState !== 'unsupported' ? 1.05 : 1 }}
        whileTap={{ scale: buttonState !== 'unsupported' ? 0.95 : 1 }}
        onClick={handleClick}
        disabled={buttonState === 'unsupported'}
        className={cn(
          'p-2 rounded-lg transition-all duration-200 relative overflow-hidden',
          getButtonStyles(),
          className
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        title={getTooltipText()}
      >
        {/* Pulse animation for listening state */}
        {isListening && (
          <motion.div
            className="absolute inset-0 bg-red-500 rounded-lg"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Icon */}
        <div className="relative z-10">
          {getIcon()}
        </div>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 
                       bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50"
          >
            {getTooltipText()}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 
                          w-2 h-2 bg-gray-900 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Dialog */}
      <AnimatePresence>
        {showPermissionDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowPermissionDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-yellow-500" />
                <h3 className="text-lg font-semibold">마이크 권한 필요</h3>
              </div>
              
              <p className="text-gray-600 mb-4">
                음성 인식 기능을 사용하려면 마이크 권한이 필요합니다. 
                브라우저 설정에서 마이크 권한을 허용해주세요.
              </p>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowPermissionDialog(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    await requestPermission();
                    setShowPermissionDialog(false);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                >
                  권한 요청
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}