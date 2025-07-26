'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SliderProps {
  id?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
  className?: string;
}

export default function Slider({ 
  id,
  value, 
  onChange, 
  min = 0, 
  max = 100, 
  step = 1,
  disabled = false,
  showValue = true,
  formatValue = (val) => val.toString(),
  className 
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const updateValue = useCallback((clientX: number) => {
    if (!sliderRef.current || disabled) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = min + percentage * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    const clampedValue = Math.max(min, Math.min(max, steppedValue));
    
    onChange(clampedValue);
  }, [min, max, step, disabled, onChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !disabled) {
      updateValue(e.clientX);
    }
  }, [isDragging, disabled, updateValue]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    
    let newValue = value;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        newValue = Math.max(min, value - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        newValue = Math.min(max, value + step);
        break;
      case 'Home':
        e.preventDefault();
        newValue = min;
        break;
      case 'End':
        e.preventDefault();
        newValue = max;
        break;
      default:
        return;
    }
    
    onChange(newValue);
  };

  return (
    <div className={cn('relative', className)}>
      <div
        ref={sliderRef}
        className={cn(
          'relative h-2 bg-muted rounded-full cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Progress track */}
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full"
          style={{ width: `${percentage}%` }}
        />
        
        {/* Slider thumb */}
        <motion.div
          className={cn(
            'absolute top-1/2 w-5 h-5 -mt-2.5 -ml-2.5 bg-white border-2 border-primary rounded-full shadow-md cursor-grab active:cursor-grabbing',
            isDragging && 'scale-110',
            disabled && 'cursor-not-allowed'
          )}
          style={{ left: `${percentage}%` }}
          whileHover={{ scale: disabled ? 1 : 1.1 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={formatValue(value)}
          aria-disabled={disabled}
        />
      </div>
      
      {/* Value display */}
      {showValue && (
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{formatValue(min)}</span>
          <span className="font-medium text-foreground">{formatValue(value)}</span>
          <span>{formatValue(max)}</span>
        </div>
      )}
    </div>
  );
}