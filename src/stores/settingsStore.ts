import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import React from 'react';

interface SettingsState {
  // AI 예측 기능 활성화 상태
  predictionEnabled: boolean;
  
  // AI 예측 토글 함수
  togglePrediction: () => void;
  
  // AI 예측 설정 함수
  setPredictionEnabled: (enabled: boolean) => void;
  
  // AI 설정
  aiResponseSpeed: 'fast' | 'balanced' | 'accurate';
  setAiResponseSpeed: (speed: 'fast' | 'balanced' | 'accurate') => void;
  
  defaultTone: 'formal' | 'professional' | 'friendly' | 'casual';
  setDefaultTone: (tone: 'formal' | 'professional' | 'friendly' | 'casual') => void;
  
  // 테마 설정
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  colorScheme: 'default' | 'blue' | 'green' | 'purple';
  setColorScheme: (scheme: 'default' | 'blue' | 'green' | 'purple') => void;
  
  // 에디터 설정
  fontSize: number;
  setFontSize: (size: number) => void;
  
  fontFamily: 'system' | 'serif' | 'mono';
  setFontFamily: (family: 'system' | 'serif' | 'mono') => void;
  
  lineHeight: number;
  setLineHeight: (height: number) => void;
  
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  
  // 개인정보 설정
  dataRetentionDays: number;
  setDataRetentionDays: (days: number) => void;
  
  allowUsageAnalytics: boolean;
  setAllowUsageAnalytics: (allow: boolean) => void;
  
  marketingNotifications: boolean;
  setMarketingNotifications: (allow: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // 기본값: AI 예측 활성화
      predictionEnabled: true,
      
      togglePrediction: () => {
        const currentState = get().predictionEnabled;
        set({ predictionEnabled: !currentState });
      },
      
      setPredictionEnabled: (enabled: boolean) => {
        set({ predictionEnabled: enabled });
      },
      
      // AI 설정 기본값
      aiResponseSpeed: 'balanced' as const,
      setAiResponseSpeed: (speed: 'fast' | 'balanced' | 'accurate') => {
        set({ aiResponseSpeed: speed });
      },
      
      defaultTone: 'professional' as const,
      setDefaultTone: (tone: 'formal' | 'professional' | 'friendly' | 'casual') => {
        set({ defaultTone: tone });
      },
      
      // 테마 설정 기본값
      theme: 'system' as const,
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });
      },
      
      colorScheme: 'default' as const,
      setColorScheme: (scheme: 'default' | 'blue' | 'green' | 'purple') => {
        set({ colorScheme: scheme });
      },
      
      // 에디터 설정 기본값
      fontSize: 16,
      setFontSize: (size: number) => {
        set({ fontSize: size });
      },
      
      fontFamily: 'system' as const,
      setFontFamily: (family: 'system' | 'serif' | 'mono') => {
        set({ fontFamily: family });
      },
      
      lineHeight: 1.6,
      setLineHeight: (height: number) => {
        set({ lineHeight: height });
      },
      
      autoSave: true,
      setAutoSave: (enabled: boolean) => {
        set({ autoSave: enabled });
      },
      
      // 개인정보 설정 기본값
      dataRetentionDays: 90,
      setDataRetentionDays: (days: number) => {
        set({ dataRetentionDays: days });
      },
      
      allowUsageAnalytics: true,
      setAllowUsageAnalytics: (allow: boolean) => {
        set({ allowUsageAnalytics: allow });
      },
      
      marketingNotifications: false,
      setMarketingNotifications: (allow: boolean) => {
        set({ marketingNotifications: allow });
      },
    }),
    {
      name: 'from-settings-storage', // localStorage 키
      skipHydration: true, // SSR 호환성을 위해 하이드레이션 건너뛰기
      // 민감하지 않은 UI 설정만 저장
      partialize: (state) => ({
        predictionEnabled: state.predictionEnabled,
        aiResponseSpeed: state.aiResponseSpeed,
        defaultTone: state.defaultTone,
        theme: state.theme,
        colorScheme: state.colorScheme,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        lineHeight: state.lineHeight,
        autoSave: state.autoSave,
        dataRetentionDays: state.dataRetentionDays,
        allowUsageAnalytics: state.allowUsageAnalytics,
        marketingNotifications: state.marketingNotifications,
      }),
    }
  )
);

// 편의를 위한 개별 hook들
export const usePredictionEnabled = () => useSettingsStore((state) => state.predictionEnabled);
export const useTogglePrediction = () => useSettingsStore((state) => state.togglePrediction);
export const useSetPredictionEnabled = () => useSettingsStore((state) => state.setPredictionEnabled);

// 추가된 설정들을 위한 hooks
export const useTheme = () => useSettingsStore((state) => state.theme);
export const useSetTheme = () => useSettingsStore((state) => state.setTheme);
// 메모이제이션된 선택자 함수들 (static으로 선언하여 참조 안정성 보장)
const editorSettingsSelector = (state: SettingsState) => ({
  fontSize: state.fontSize,
  fontFamily: state.fontFamily,
  lineHeight: state.lineHeight,
  autoSave: state.autoSave,
  setFontSize: state.setFontSize,
  setFontFamily: state.setFontFamily,
  setLineHeight: state.setLineHeight,
  setAutoSave: state.setAutoSave,
});

const aiSettingsSelector = (state: SettingsState) => ({
  speed: state.aiResponseSpeed,
  tone: state.defaultTone,
  setSpeed: state.setAiResponseSpeed,
  setTone: state.setDefaultTone,
});

// 서버 스냅샷 캐싱을 위한 기본값들 (immutable 객체)
const SERVER_SNAPSHOT_DEFAULTS = Object.freeze({
  fontSize: 16,
  fontFamily: 'system' as const,
  lineHeight: 1.6,
  autoSave: true,
  setFontSize: () => {},
  setFontFamily: () => {},
  setLineHeight: () => {},
  setAutoSave: () => {},
});

// SSR 호환 훅 - 개별 값들을 가져와서 안정적인 객체 반환
export const useEditorSettings = () => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  // 개별 값들을 안전하게 가져오기
  const fontSize = useSettingsStore(state => state.fontSize);
  const fontFamily = useSettingsStore(state => state.fontFamily);
  const lineHeight = useSettingsStore(state => state.lineHeight);
  const autoSave = useSettingsStore(state => state.autoSave);
  const setFontSize = useSettingsStore(state => state.setFontSize);
  const setFontFamily = useSettingsStore(state => state.setFontFamily);
  const setLineHeight = useSettingsStore(state => state.setLineHeight);
  const setAutoSave = useSettingsStore(state => state.setAutoSave);
  
  // 마운트되기 전까지는 기본값 사용, 이후에는 실제 값 사용
  return React.useMemo(() => {
    if (!mounted) {
      return SERVER_SNAPSHOT_DEFAULTS;
    }
    return {
      fontSize,
      fontFamily,
      lineHeight,
      autoSave,
      setFontSize,
      setFontFamily,
      setLineHeight,
      setAutoSave,
    };
  }, [mounted, fontSize, fontFamily, lineHeight, autoSave, setFontSize, setFontFamily, setLineHeight, setAutoSave]);
};

export const useAiSettings = () => useSettingsStore(aiSettingsSelector);

// 하이드레이션 함수 - 클라이언트 사이드에서 호출
export const hydrateSettingsStore = () => {
  useSettingsStore.persist.rehydrate();
};