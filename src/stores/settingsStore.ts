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
  
  // 에디터 설정
  fontSize: number;
  setFontSize: (size: number) => void;
  
  fontFamily: 'system' | 'serif' | 'mono';
  setFontFamily: (family: 'system' | 'serif' | 'mono') => void;
  
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
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
      
      // 에디터 설정 기본값
      fontSize: 16,
      setFontSize: (size: number) => {
        set({ fontSize: size });
      },
      
      fontFamily: 'system' as const,
      setFontFamily: (family: 'system' | 'serif' | 'mono') => {
        set({ fontFamily: family });
      },
      
      autoSave: true,
      setAutoSave: (enabled: boolean) => {
        set({ autoSave: enabled });
      },
    }),
    {
      name: 'from-settings-storage', // localStorage 키
      // UI 설정 저장
      partialize: (state) => ({
        predictionEnabled: state.predictionEnabled,
        aiResponseSpeed: state.aiResponseSpeed,
        defaultTone: state.defaultTone,
        theme: state.theme,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        autoSave: state.autoSave,
      }),
    }
  )
);

// 편의를 위한 개별 hook들
export const usePredictionEnabled = () => useSettingsStore((state) => state.predictionEnabled);
export const useTogglePrediction = () => useSettingsStore((state) => state.togglePrediction);
export const useSetPredictionEnabled = () => useSettingsStore((state) => state.setPredictionEnabled);

// 테마 설정 hooks
export const useTheme = () => useSettingsStore((state) => state.theme);
export const useSetTheme = () => useSettingsStore((state) => state.setTheme);

// AI 설정 hooks
export const useAiSettings = () => useSettingsStore((state) => ({
  predictionEnabled: state.predictionEnabled,
  speed: state.aiResponseSpeed,
  tone: state.defaultTone,
  setPredictionEnabled: state.setPredictionEnabled,
  setSpeed: state.setAiResponseSpeed,
  setTone: state.setDefaultTone,
}));

// 에디터 설정 hooks
export const useEditorSettings = () => useSettingsStore((state) => ({
  fontSize: state.fontSize,
  fontFamily: state.fontFamily,
  autoSave: state.autoSave,
  setFontSize: state.setFontSize,
  setFontFamily: state.setFontFamily,
  setAutoSave: state.setAutoSave,
}));