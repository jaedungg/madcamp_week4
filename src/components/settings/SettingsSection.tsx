'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export default function SettingsSection({
  title,
  description,
  children,
  className,
  headerClassName,
  contentClassName,
}: SettingsSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-card rounded-lg border border-border p-6',
        className
      )}
    >
      {/* Section Header */}
      <div className={cn('mb-6', headerClassName)}>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Section Content */}
      <div className={cn('space-y-4', contentClassName)}>
        {children}
      </div>
    </motion.section>
  );
}

// Individual setting item component
interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  direction?: 'horizontal' | 'vertical';
}

export function SettingItem({
  label,
  description,
  children,
  className,
  labelClassName,
  direction = 'horizontal',
}: SettingItemProps) {
  const isHorizontal = direction === 'horizontal';

  return (
    <div
      className={cn(
        'flex gap-4',
        isHorizontal ? 'items-center justify-between' : 'flex-col',
        className
      )}
    >
      <div className={cn('flex-1', labelClassName)}>
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      <div className={cn('flex-shrink-0', !isHorizontal && 'mt-2')}>
        {children}
      </div>
    </div>
  );
}

// Select dropdown component for settings
interface SettingSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
}

export function SettingSelect({
  id,
  value,
  onChange,
  options,
  disabled = false,
  className,
}: SettingSelectProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

// Input component for settings
interface SettingInputProps {
  id?: string;
  type?: 'text' | 'email' | 'password' | 'number';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SettingInput({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  className,
}: SettingInputProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    />
  );
}

// Button component for settings actions
interface SettingButtonProps {
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function SettingButton({
  onClick,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  className,
}: SettingButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary',
    secondary: 'bg-muted text-foreground hover:bg-accent focus:ring-muted-foreground',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}