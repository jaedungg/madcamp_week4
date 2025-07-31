'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Palette,
  Type,
  Shield,
  Save,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import SettingsSection, {
  SettingItem,
  SettingSelect,
  SettingButton
} from '@/components/settings/SettingsSection';
import Toggle from '@/components/settings/Toggle';
import Slider from '@/components/settings/Slider';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    // AI 설정
    predictionEnabled,
    setPredictionEnabled,
    aiResponseSpeed,
    setAiResponseSpeed,
    defaultTone,
    setDefaultTone,

    // 테마 설정
    theme,
    setTheme,

    // 에디터 설정
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    autoSave,
    setAutoSave,
  } = useSettingsStore();

  // 테마 적용 함수
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;

      if (theme === 'dark') {
        root.classList.add('dark');
      } else if (theme === 'light') {
        root.classList.remove('dark');
      } else {
        // system theme
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }

        // Listen for system theme changes
        const handleChange = (e: MediaQueryListEvent) => {
          if (theme === 'system') {
            if (e.matches) {
              root.classList.add('dark');
            } else {
              root.classList.remove('dark');
            }
          }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    };

    applyTheme();
  }, [theme]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // 설정을 서버에 저장 (현재는 localStorage에 자동 저장됨)
      // TODO: 서버 API 연동시 여기에 구현
      await new Promise(resolve => setTimeout(resolve, 800));
      setSaved(true);

      // 2초 후 저장 상태 초기화
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('설정 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      // 기본값으로 초기화
      setPredictionEnabled(true);
      setAiResponseSpeed('balanced');
      setDefaultTone('professional');
      setTheme('system');
      setFontSize(16);
      setFontFamily('system');
      setAutoSave(true);
    }
  };

  const aiSpeedOptions = [
    { value: 'fast', label: '빠름' },
    { value: 'balanced', label: '균형' },
    { value: 'accurate', label: '정확함' },
  ];

  const toneOptions = [
    { value: 'formal', label: '격식체' },
    { value: 'professional', label: '전문체' },
    { value: 'friendly', label: '친근체' },
    { value: 'casual', label: '반말체' },
  ];

  const themeOptions = [
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
    { value: 'system', label: '시스템', icon: Monitor },
  ];

  const fontFamilyOptions = [
    { value: 'system', label: '시스템 폰트' },
    { value: 'serif', label: '명조체' },
    { value: 'mono', label: '고정폭' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">설정</h1>
          <p className="text-muted-foreground mt-1">
            프롬을 사용자에게 맞게 설정하세요
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SettingButton
            onClick={handleReset}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </SettingButton>

          <SettingButton
            onClick={handleSave}
            variant="primary"
            loading={isLoading}
            className="flex items-center gap-2"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                저장됨
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                저장
              </>
            )}
          </SettingButton>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* AI 설정 */}
          <SettingsSection
            title="AI 설정"
            description="AI 도우미 동작 방식"
          >
            <SettingItem
              label="텍스트 예측"
              description="입력 중 단어 제안 기능"
            >
              <Toggle
                checked={predictionEnabled}
                onChange={setPredictionEnabled}
              />
            </SettingItem>

            <SettingItem
              label="응답 속도"
              description="AI 응답의 속도와 품질 조절"
              direction="vertical"
            >
              <SettingSelect
                value={aiResponseSpeed}
                onChange={(value) => setAiResponseSpeed(value as "fast" | "balanced" | "accurate")}
                options={aiSpeedOptions}
                className="w-full"
              />
            </SettingItem>

            <SettingItem
              label="기본 어조"
              description="생성 텍스트의 기본 톤"
              direction="vertical"
            >
              <SettingSelect
                value={defaultTone}
                onChange={(value) => setDefaultTone(value as "formal" | "professional" | "friendly" | "casual")}
                options={toneOptions}
                className="w-full"
              />
            </SettingItem>
          </SettingsSection>

          {/* 화면 설정 */}
          <SettingsSection
            title="화면 설정"
            description="테마 및 표시 방식"
          >
            <SettingItem
              label="테마"
              description="화면 모드 선택"
              direction="vertical"
            >
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value as "system" | "light" | "dark")}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${theme === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background hover:bg-muted'
                        }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </SettingItem>
          </SettingsSection>

          {/* 에디터 설정 */}
          <SettingsSection
            title="에디터 설정"
            description="텍스트 편집기 설정"
          >
            <SettingItem
              label="자동 저장"
              description="변경사항 자동 저장"
            >
              <Toggle
                checked={autoSave}
                onChange={setAutoSave}
              />
            </SettingItem>

            <SettingItem
              label="폰트 크기"
              description="기본 텍스트 크기"
              direction="vertical"
            >
              <Slider
                value={fontSize}
                onChange={setFontSize}
                min={12}
                max={24}
                step={1}
                formatValue={(val) => `${val}px`}
                className="w-full"
              />
            </SettingItem>

            <SettingItem
              label="폰트"
              description="사용할 폰트 선택"
              direction="vertical"
            >
              <SettingSelect
                value={fontFamily}
                onChange={(value) => setFontFamily(value as "system" | "serif" | "mono")}
                options={fontFamilyOptions}
                className="w-full"
              />
            </SettingItem>
          </SettingsSection>

        </div>
      </div>
    </div>
  );
}