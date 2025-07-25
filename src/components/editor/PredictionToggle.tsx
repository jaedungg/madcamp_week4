'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePredictionEnabled, useTogglePrediction } from '@/stores/settingsStore';

interface PredictionToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function PredictionToggle({ 
  className, 
  showLabel = true,
  size = 'md' 
}: PredictionToggleProps) {
  const predictionEnabled = usePredictionEnabled();
  const togglePrediction = useTogglePrediction();

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const handleToggle = () => {
    togglePrediction();
    
    // 간단한 햅틱 피드백 (지원되는 기기에서)
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggle}
      className={cn(
        'flex items-center gap-2 rounded-lg font-medium transition-all duration-200',
        'border focus:outline-none focus:ring-2 focus:ring-offset-2',
        sizeClasses[size],
        predictionEnabled 
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg hover:shadow-xl focus:ring-blue-500' 
          : 'bg-muted text-muted-foreground border-border hover:bg-accent hover:text-foreground focus:ring-muted-foreground',
        className
      )}
      title={predictionEnabled ? 'AI 예측 비활성화' : 'AI 예측 활성화'}
      aria-label={predictionEnabled ? 'AI 예측 비활성화' : 'AI 예측 활성화'}
      aria-pressed={predictionEnabled}
    >
      {/* 아이콘 애니메이션 */}
      <motion.div
        animate={{
          rotate: predictionEnabled ? 0 : 180,
          scale: predictionEnabled ? 1 : 0.8
        }}
        transition={{ duration: 0.2 }}
      >
        <Zap 
          className={cn(
            iconSizes[size],
            predictionEnabled ? 'fill-current' : ''
          )} 
        />
      </motion.div>

      {/* 레이블 */}
      {showLabel && (
        <motion.span
          initial={false}
          animate={{ 
            opacity: 1,
            x: 0 
          }}
          transition={{ duration: 0.15 }}
        >
          AI 예측
        </motion.span>
      )}

      {/* 상태 표시 점 */}
      <motion.div
        className={cn(
          'w-2 h-2 rounded-full',
          predictionEnabled ? 'bg-white/80' : 'bg-muted-foreground/60'
        )}
        animate={{
          scale: predictionEnabled ? [1, 1.2, 1] : 1,
        }}
        transition={{
          duration: predictionEnabled ? 1.5 : 0,
          repeat: predictionEnabled ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
}

// 미니 버전 (아이콘만)
export function PredictionToggleMini({ className }: { className?: string }) {
  return (
    <PredictionToggle 
      className={className}
      showLabel={false}
      size="sm"
    />
  );
}

// 큰 버전 (설정 페이지용)
export function PredictionToggleLarge({ className }: { className?: string }) {
  const predictionEnabled = usePredictionEnabled();
  
  return (
    <div className={cn('flex items-center justify-between p-4 bg-card border border-border rounded-lg', className)}>
      <div>
        <h3 className="font-medium text-foreground">AI 텍스트 예측</h3>
        <p className="text-sm text-muted-foreground">
          {predictionEnabled 
            ? '입력 중 AI가 자동으로 텍스트를 예측하여 제안합니다' 
            : '텍스트 예측 기능이 비활성화되어 있습니다'
          }
        </p>
      </div>
      <PredictionToggle 
        showLabel={false}
        size="lg"
      />
    </div>
  );
}