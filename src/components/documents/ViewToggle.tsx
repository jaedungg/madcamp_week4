'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Grid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  className?: string;
}

export default function ViewToggle({
  viewMode,
  onViewModeChange,
  className
}: ViewToggleProps) {
  return (
    <div className={cn('flex items-center bg-muted rounded-lg p-1', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewModeChange('grid')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200',
          viewMode === 'grid'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <Grid className="w-4 h-4" />
        <span className="hidden sm:inline">격자</span>
      </motion.button>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onViewModeChange('list')}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200',
          viewMode === 'list'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">목록</span>
      </motion.button>
    </div>
  );
}