'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToggleProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: {
    track: 'w-8 h-5',
    thumb: 'w-3 h-3',
    translate: 'translate-x-3'
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4',
    translate: 'translate-x-5'
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5',
    translate: 'translate-x-7'
  }
};

export default function Toggle({ 
  id,
  checked, 
  onChange, 
  disabled = false, 
  size = 'md',
  className 
}: ToggleProps) {
  const { track, thumb, translate } = sizeClasses[size];

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        track,
        checked 
          ? 'bg-primary' 
          : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <motion.span
        layout
        transition={{
          type: "spring",
          stiffness: 700,
          damping: 30
        }}
        className={cn(
          'inline-block rounded-full bg-white shadow-sm ring-0 transition-transform',
          thumb,
          checked ? translate : 'translate-x-1'
        )}
      />
    </button>
  );
}