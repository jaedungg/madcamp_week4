'use client';

import React, { useState, useEffect } from 'react';
import { Save, RotateCcw, Check } from 'lucide-react';
import SettingsSection, {
  SettingItem,
  SettingSelect,
  SettingButton
} from '@/components/settings/SettingsSection';
import Toggle from '@/components/settings/Toggle';
import { useSettingsStore, hydrateSettingsStore } from '@/stores/settingsStore';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  const {
    // AI 설정
    predictionEnabled,
    setPredictionEnabled,
    defaultTone,
    setDefaultTone,

    // 테마 설정
    theme,
    setTheme,

    // 에디터 설정
    autoSave,
    setAutoSave,
  } = useSettingsStore();

  // 하이드레이션 및 설정 로드
  useEffect(() => {
    const initializeSettings = async () => {
      // 먼저 하이드레이션 실행
      hydrateSettingsStore();
      setIsHydrated(true);

      // 그 다음 서버에서 설정 로드
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            const { settings } = data;
            setPredictionEnabled(settings.predictionEnabled);
            setDefaultTone(settings.defaultTone);
            setTheme(settings.theme);
            setAutoSave(settings.autoSave);
          }
        }
      } catch (error) {
        console.error('설정 로드 중 오류:', error);
      }
    };

    initializeSettings();
  }, [setPredictionEnabled, setDefaultTone, setTheme, setAutoSave]);

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictionEnabled,
          defaultTone,
          theme,
          autoSave
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        console.error('설정 저장 실패:', data.error);
        // 실제 구현에서는 토스트 메시지나 알림을 표시할 수 있음
      }
    } catch (error) {
      console.error('설정 저장 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setPredictionEnabled(true);
    setDefaultTone('professional');
    setTheme('system');
    setAutoSave(true);
  };

  const toneOptions = [
    { value: 'formal', label: '격식체 - 공식적이고 정중한 톤' },
    { value: 'professional', label: '전문체 - 비즈니스 상황에 적합한 톤' },
    { value: 'friendly', label: '친근체 - 친숙하고 다정한 톤' },
    { value: 'casual', label: '반말체 - 편안하고 자유로운 톤' },
  ];

  const themeOptions = [
    { value: 'light', label: '라이트' },
    { value: 'dark', label: '다크' },
    { value: 'system', label: '시스템' },
  ];

  // 하이드레이션이 완료되지 않았으면 로딩 표시
  if (!isHydrated) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">설정</h1>
            <p className="text-muted-foreground mt-1">설정을 불러오는 중...</p>
          </div>
        </div>
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-lg"></div>
            <div className="h-20 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">설정</h1>
          <p className="text-muted-foreground mt-1">필수 설정들을 간단하게</p>
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
        <div className="max-w-2xl mx-auto space-y-6">

          {/* AI 설정 */}
          <SettingsSection
            title="AI 설정"
            description="AI 기능을 설정합니다"
          >
            <SettingItem
              label="AI 예측"
              description="입력 중 다음 단어 제안"
            >
              <Toggle
                checked={predictionEnabled}
                onChange={setPredictionEnabled}
              />
            </SettingItem>

            <SettingItem
              label="기본 톤"
              description="AI 텍스트의 기본 어조"
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

          {/* 기본 설정 */}
          <SettingsSection
            title="기본 설정"
            description="앱의 기본 동작을 설정합니다"
          >
            <SettingItem
              label="테마"
              description="화면 테마 선택"
              direction="vertical"
            >
              <SettingSelect
                value={theme}
                onChange={(value) => setTheme(value as "system" | "light" | "dark")}
                options={themeOptions}
                className="w-full"
              />
            </SettingItem>

            <SettingItem
              label="자동 저장"
              description="변경사항 자동 저장"
            >
              <Toggle
                checked={autoSave}
                onChange={setAutoSave}
              />
            </SettingItem>
          </SettingsSection>

        </div>
      </div>
    </div>
  );
}