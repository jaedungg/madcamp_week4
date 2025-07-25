import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  // AI 예측 기능 활성화 상태
  predictionEnabled: boolean;
  
  // AI 예측 토글 함수
  togglePrediction: () => void;
  
  // AI 예측 설정 함수
  setPredictionEnabled: (enabled: boolean) => void;
  
  // 향후 확장을 위한 기타 설정들
  autoSave: boolean;
  setAutoSave: (enabled: boolean) => void;
  
  // 에디터 설정
  fontSize: number;
  setFontSize: (size: number) => void;
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
      
      // 기타 설정 기본값
      autoSave: true,
      setAutoSave: (enabled: boolean) => {
        set({ autoSave: enabled });
      },
      
      fontSize: 16,
      setFontSize: (size: number) => {
        set({ fontSize: size });
      },
    }),
    {
      name: 'from-settings-storage', // localStorage 키
      // 민감하지 않은 UI 설정만 저장
      partialize: (state) => ({
        predictionEnabled: state.predictionEnabled,
        autoSave: state.autoSave,
        fontSize: state.fontSize,
      }),
    }
  )
);

// 편의를 위한 개별 hook들
export const usePredictionEnabled = () => useSettingsStore((state) => state.predictionEnabled);
export const useTogglePrediction = () => useSettingsStore((state) => state.togglePrediction);
export const useSetPredictionEnabled = () => useSettingsStore((state) => state.setPredictionEnabled);