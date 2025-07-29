'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSettingsStore, hydrateSettingsStore } from '@/stores/settingsStore';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useSettingsStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // 하이드레이션 처리
  useEffect(() => {
    hydrateSettingsStore();
    setIsHydrated(true);
  }, []);

  // 시스템 테마 감지
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // 실제 적용될 테마 계산 (하이드레이션 전에는 기본값 사용)
  const resolvedTheme: 'light' | 'dark' =
    isHydrated
      ? theme === 'system'
        ? getSystemTheme()
        : theme === 'dark'
          ? 'dark'
          : 'light'
      : 'light';

  // 테마 적용
  useEffect(() => {
    const root = document.documentElement;

    // 기존 테마 클래스 제거
    root.classList.remove('light', 'dark');

    // 새 테마 클래스 추가
    root.classList.add(resolvedTheme);

    // CSS 변수 업데이트
    if (resolvedTheme === 'dark') {
      root.style.setProperty('--background', '#0a0a0a');
      root.style.setProperty('--foreground', '#ededed');
      root.style.setProperty('--muted-foreground', '#9ca3af');
      root.style.setProperty('--accent', '#1f2937');
      root.style.setProperty('--border', '#374151');
    } else {
      root.style.setProperty('--background', '#ffffff');
      root.style.setProperty('--foreground', '#171717');
      root.style.setProperty('--muted-foreground', '#6b7280');
      root.style.setProperty('--accent', '#f3f4f6');
      root.style.setProperty('--border', '#e5e7eb');
    }
  }, [resolvedTheme]);

  // 시스템 테마 변경 감지 (하이드레이션 완료 후에만)
  useEffect(() => {
    if (!isHydrated || theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // 테마가 시스템 모드일 때만 업데이트
      if (theme === 'system') {
        const newResolvedTheme = mediaQuery.matches ? 'dark' : 'light';
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isHydrated, theme]);

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}