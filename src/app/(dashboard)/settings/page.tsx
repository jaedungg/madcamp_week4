'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Palette, 
  Type, 
  Shield, 
  Save,
  RotateCcw,
  Check
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
    colorScheme,
    setColorScheme,
    
    // 에디터 설정
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    lineHeight,
    setLineHeight,
    autoSave,
    setAutoSave,
    
    // 개인정보 설정
    dataRetentionDays,
    setDataRetentionDays,
    allowUsageAnalytics,
    setAllowUsageAnalytics,
    marketingNotifications,
    setMarketingNotifications,
  } = useSettingsStore();

  const handleSave = async () => {
    setIsLoading(true);
    // 실제 구현에서는 서버에 설정 저장
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaved(true);
    setIsLoading(false);
    
    // 2초 후 저장 상태 초기화
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    // 기본값으로 초기화
    setPredictionEnabled(true);
    setAiResponseSpeed('balanced');
    setDefaultTone('professional');
    setTheme('system');
    setColorScheme('default');
    setFontSize(16);
    setFontFamily('system');
    setLineHeight(1.6);
    setAutoSave(true);
    setDataRetentionDays(90);
    setAllowUsageAnalytics(true);
    setMarketingNotifications(false);
  };

  const aiSpeedOptions = [
    { value: 'fast', label: '빠름 - 신속한 응답' },
    { value: 'balanced', label: '균형 - 속도와 품질의 균형' },
    { value: 'accurate', label: '정확함 - 신중하고 정확한 응답' },
  ];

  const toneOptions = [
    { value: 'formal', label: '격식체 - 공식적이고 정중한 톤' },
    { value: 'professional', label: '전문체 - 비즈니스 상황에 적합' },
    { value: 'friendly', label: '친근체 - 친숙하고 다정한 톤' },
    { value: 'casual', label: '반말체 - 편안하고 자유로운 톤' },
  ];

  const themeOptions = [
    { value: 'light', label: '라이트 모드' },
    { value: 'dark', label: '다크 모드' },
    { value: 'system', label: '시스템 설정 따르기' },
  ];

  const colorSchemeOptions = [
    { value: 'default', label: '기본 (블루)' },
    { value: 'blue', label: '블루' },
    { value: 'green', label: '그린' },
    { value: 'purple', label: '퍼플' },
  ];

  const fontFamilyOptions = [
    { value: 'system', label: '시스템 기본 폰트' },
    { value: 'serif', label: '명조체 (Serif)' },
    { value: 'mono', label: '고정폭 (Monospace)' },
  ];

  const retentionOptions = [
    { value: '30', label: '30일' },
    { value: '90', label: '90일' },
    { value: '180', label: '180일' },
    { value: '365', label: '1년' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">설정</h1>
          <p className="text-muted-foreground mt-1">
            프롬의 동작 방식을 개인화하세요
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
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* AI 설정 */}
          <SettingsSection
            title="AI 설정"
            description="AI 도우미의 동작 방식을 조정합니다"
          >
            <SettingItem
              label="AI 예측 기능"
              description="입력하는 동안 다음 단어를 미리 제안합니다"
            >
              <Toggle
                checked={predictionEnabled}
                onChange={setPredictionEnabled}
              />
            </SettingItem>

            <SettingItem
              label="응답 속도"
              description="AI 응답의 속도와 품질을 조절합니다"
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
              label="기본 톤"
              description="AI가 생성하는 텍스트의 기본 어조를 설정합니다"
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

          {/* 테마 설정 */}
          <SettingsSection
            title="테마 설정"
            description="인터페이스의 모양과 색상을 변경합니다"
          >
            <SettingItem
              label="테마 모드"
              description="라이트 또는 다크 모드를 선택하거나 시스템 설정을 따릅니다"
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
              label="색상 테마"
              description="인터페이스의 강조 색상을 선택합니다"
              direction="vertical"
            >
              <SettingSelect
                value={colorScheme}
                onChange={(value) => setColorScheme(value as "default" | "blue" | "green" | "purple")}
                options={colorSchemeOptions}
                className="w-full"
              />
            </SettingItem>
          </SettingsSection>

          {/* 에디터 설정 */}
          <SettingsSection
            title="에디터 설정"
            description="텍스트 편집기의 모양과 동작을 조정합니다"
          >
            <SettingItem
              label="자동 저장"
              description="변경사항을 자동으로 저장합니다"
            >
              <Toggle
                checked={autoSave}
                onChange={setAutoSave}
              />
            </SettingItem>

            <SettingItem
              label="폰트 크기"
              description="에디터의 기본 폰트 크기를 설정합니다"
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
              label="폰트 패밀리"
              description="에디터에서 사용할 폰트를 선택합니다"
              direction="vertical"
            >
              <SettingSelect
                value={fontFamily}
                onChange={(value) => setFontFamily(value as "system" | "serif" | "mono")}
                options={fontFamilyOptions}
                className="w-full"
              />
            </SettingItem>

            <SettingItem
              label="줄 간격"
              description="텍스트 줄 사이의 간격을 조정합니다"
              direction="vertical"
            >
              <Slider
                value={lineHeight}
                onChange={setLineHeight}
                min={1.0}
                max={2.5}
                step={0.1}
                formatValue={(val) => val.toFixed(1)}
                className="w-full"
              />
            </SettingItem>
          </SettingsSection>

          {/* 개인정보 설정 */}
          <SettingsSection
            title="개인정보 설정"
            description="데이터 보관 및 프라이버시 관련 설정을 관리합니다"
          >
            <SettingItem
              label="데이터 보관 기간"
              description="작성한 문서가 보관되는 기간을 설정합니다"
              direction="vertical"
            >
              <SettingSelect
                value={dataRetentionDays.toString()}
                onChange={(value) => setDataRetentionDays(parseInt(value))}
                options={retentionOptions}
                className="w-full"
              />
            </SettingItem>

            <SettingItem
              label="사용량 분석 허용"
              description="서비스 개선을 위한 익명화된 사용 패턴 수집에 동의합니다"
            >
              <Toggle
                checked={allowUsageAnalytics}
                onChange={setAllowUsageAnalytics}
              />
            </SettingItem>

            <SettingItem
              label="마케팅 알림"
              description="새로운 기능 및 프로모션 알림을 받습니다"
            >
              <Toggle
                checked={marketingNotifications}
                onChange={setMarketingNotifications}
              />
            </SettingItem>
          </SettingsSection>

        </div>
      </div>
    </div>
  );
}