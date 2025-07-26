import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
export const useAiSettings = () => useSettingsStore((state) => ({
  speed: state.aiResponseSpeed,
  tone: state.defaultTone,
  setSpeed: state.setAiResponseSpeed,
  setTone: state.setDefaultTone,
}));
export const useEditorSettings = () => useSettingsStore((state) => ({
  fontSize: state.fontSize,
  fontFamily: state.fontFamily,
  lineHeight: state.lineHeight,
  autoSave: state.autoSave,
  setFontSize: state.setFontSize,
  setFontFamily: state.setFontFamily,
  setLineHeight: state.setLineHeight,
  setAutoSave: state.setAutoSave,
}));