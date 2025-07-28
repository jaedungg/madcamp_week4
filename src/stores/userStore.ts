import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  created_at: Date;
  lastLoginAt: Date;
}

export interface PlanInfo {
  type: 'free' | 'premium' | 'enterprise';
  displayName: string;
  maxDocuments: number;
  maxAiRequestsPerMonth: number;
  features: string[];
  expiresAt?: Date;
}

export interface UsageStats {
  documentsCreated: number;
  aiRequestsThisMonth: number;
  aiRequestsTotal: number;
  favoriteFeatures: string[];
  lastActivity: Date;
}

interface UserState {
  // 프로필 정보
  profile: UserProfile;
  setProfile: (profile: Partial<UserProfile>) => void;
  updateAvatar: (avatar: string) => void;
  
  // 플랜 정보
  plan: PlanInfo;
  setPlan: (plan: PlanInfo) => void;
  
  // 사용 통계
  stats: UsageStats;
  incrementDocumentCount: () => void;
  incrementAiRequest: () => void;
  updateLastActivity: () => void;
  addFavoriteFeature: (feature: string) => void;
  
  // 계정 관리
  twoFactorEnabled: boolean;
  setTwoFactorEnabled: (enabled: boolean) => void;
  
  // 데이터 관리
  exportUserData: () => Promise<Blob>;
  requestAccountDeletion: () => Promise<void>;
}

// 기본 프로필 데이터
const defaultProfile: UserProfile = {
  id: 'user-1',
  name: '김프롬',
  email: 'user@from-ai.com',
  created_at: new Date('2024-01-01'),
  lastLoginAt: new Date(),
};

// 기본 플랜 정보
const defaultPlan: PlanInfo = {
  type: 'free',
  displayName: '무료 플랜',
  maxDocuments: 50,
  maxAiRequestsPerMonth: 100,
  features: [
    'AI 글쓰기 도우미',
    '기본 템플릿',
    '문서 저장',
    '기본 톤 조절',
  ],
};

// 기본 사용 통계
const defaultStats: UsageStats = {
  documentsCreated: 12,
  aiRequestsThisMonth: 23,
  aiRequestsTotal: 87,
  favoriteFeatures: ['AI로 작성하기', '글 다듬기'],
  lastActivity: new Date('2024-01-15T10:30:00Z'), // 고정된 날짜 사용
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // 프로필 기본값
      profile: defaultProfile,
      
      setProfile: (updates: Partial<UserProfile>) => {
        set((state) => ({
          profile: { ...state.profile, ...updates }
        }));
      },
      
      updateAvatar: (avatar: string) => {
        set((state) => ({
          profile: { ...state.profile, avatar }
        }));
      },
      
      // 플랜 기본값
      plan: defaultPlan,
      
      setPlan: (plan: PlanInfo) => {
        set({ plan });
      },
      
      // 사용 통계 기본값
      stats: defaultStats,
      
      incrementDocumentCount: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            documentsCreated: state.stats.documentsCreated + 1
          }
        }));
      },
      
      incrementAiRequest: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            aiRequestsThisMonth: state.stats.aiRequestsThisMonth + 1,
            aiRequestsTotal: state.stats.aiRequestsTotal + 1
          }
        }));
      },
      
      updateLastActivity: () => {
        set((state) => ({
          stats: {
            ...state.stats,
            lastActivity: new Date()
          }
        }));
      },
      
      addFavoriteFeature: (feature: string) => {
        set((state) => {
          const features = state.stats.favoriteFeatures;
          if (!features.includes(feature)) {
            return {
              stats: {
                ...state.stats,
                favoriteFeatures: [...features, feature]
              }
            };
          }
          return state;
        });
      },
      
      // 계정 관리 기본값
      twoFactorEnabled: false,
      
      setTwoFactorEnabled: (enabled: boolean) => {
        set({ twoFactorEnabled: enabled });
      },
      
      // 데이터 관리 함수들
      exportUserData: async () => {
        const state = get();
        const userData = {
          profile: state.profile,
          plan: state.plan,
          stats: state.stats,
          exportedAt: new Date().toISOString(),
        };
        
        const blob = new Blob([JSON.stringify(userData, null, 2)], {
          type: 'application/json'
        });
        
        return blob;
      },
      
      requestAccountDeletion: async () => {
        // 실제 구현에서는 서버 API 호출
        console.log('계정 삭제 요청이 접수되었습니다.');
        // 여기서는 로컬 데이터 초기화
        set({
          profile: defaultProfile,
          plan: defaultPlan,
          stats: defaultStats,
          twoFactorEnabled: false,
        });
      },
    }),
    {
      name: 'from-user-storage',
      // 민감한 정보는 제외하고 저장
      partialize: (state) => ({
        profile: {
          id: state.profile.id,
          name: state.profile.name,
          email: state.profile.email,
          avatar: state.profile.avatar,
          created_at: state.profile.created_at,
          lastLoginAt: state.profile.lastLoginAt,
        },
        plan: state.plan,
        stats: {
          ...state.stats,
          lastActivity: state.stats.lastActivity.toISOString(),
        },
        twoFactorEnabled: state.twoFactorEnabled,
      }),
      // 저장된 데이터를 복원할 때 Date 객체 변환
      onRehydrateStorage: () => (state) => {
        if (state) {
          // lastActivity를 Date 객체로 변환
          if (typeof state.stats.lastActivity === 'string') {
            state.stats.lastActivity = new Date(state.stats.lastActivity);
          }
          // created_at과 lastLoginAt도 Date 객체로 변환
          if (typeof state.profile.created_at === 'string') {
            state.profile.created_at = new Date(state.profile.created_at);
          }
          if (typeof state.profile.lastLoginAt === 'string') {
            state.profile.lastLoginAt = new Date(state.profile.lastLoginAt);
          }
        }
      },
    }
  )
);

// 편의를 위한 개별 hooks
export const useUserProfile = () => useUserStore((state) => state.profile);
export const useSetUserProfile = () => useUserStore((state) => state.setProfile);
export const useUserPlan = () => useUserStore((state) => state.plan);
export const useUserStats = () => useUserStore((state) => state.stats);
export const useUsageProgress = () => useUserStore((state) => {
  const { stats, plan } = state;
  return {
    documentsUsed: stats.documentsCreated,
    documentsLimit: plan.maxDocuments,
    documentsProgress: Math.min((stats.documentsCreated / plan.maxDocuments) * 100, 100),
    aiRequestsUsed: stats.aiRequestsThisMonth,
    aiRequestsLimit: plan.maxAiRequestsPerMonth,
    aiRequestsProgress: Math.min((stats.aiRequestsThisMonth / plan.maxAiRequestsPerMonth) * 100, 100),
  };
});

// 플랜별 색상 및 스타일 헬퍼
export const getPlanColor = (planType: PlanInfo['type']) => {
  switch (planType) {
    case 'free':
      return 'text-gray-600 bg-gray-100';
    case 'premium':
      return 'text-blue-600 bg-blue-100';
    case 'enterprise':
      return 'text-purple-600 bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

// 사용량 상태별 색상 헬퍼
export const getUsageColor = (percentage: number) => {
  if (percentage >= 90) return 'text-red-600 bg-red-100';
  if (percentage >= 75) return 'text-orange-600 bg-orange-100';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
};