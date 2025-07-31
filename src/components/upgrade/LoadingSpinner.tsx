'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  message, 
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn('flex flex-col items-center justify-center space-y-3', className)}
    >
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {message && (
        <p className={cn('text-muted-foreground text-center', textSizeClasses[size])}>
          {message}
        </p>
      )}
    </motion.div>
  );
}

export function LoadingCard({ 
  title = '로딩 중...',
  message,
  className 
}: {
  title?: string;
  message?: string;
  className?: string;
}) {
  return (
    <div className={cn('border border-border rounded-lg p-8', className)}>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <h3 className="text-lg font-semibold text-foreground mt-4 mb-2">
          {title}
        </h3>
        {message && (
          <p className="text-muted-foreground">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

export function LoadingOverlay({ 
  isVisible, 
  message = '처리 중...',
  className 
}: {
  isVisible: boolean;
  message?: string;
  className?: string;
}) {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
        className
      )}
    >
      <div className="bg-background border border-border rounded-lg p-8 shadow-lg">
        <LoadingSpinner size="lg" message={message} />
      </div>
    </motion.div>
  );
}