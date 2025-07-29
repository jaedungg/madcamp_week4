'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Zap, 
  TrendingUp, 
  Clock,
  Heart,
  BarChart3,
  Calendar,
  Target,
  RefreshCw
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useSession } from 'next-auth/react';

interface StatsCardProps {
  className?: string;
}

// API 응답 타입
interface DocumentStats {
  totalDocuments: number;
  totalWords: number;
  avgWordsPerDocument: number;
  documentsByCategory: Record<string, number>;
  documentsByStatus: Record<string, number>;
  weeklyActivity: Array<{ date: string; count: number }>;
  aiUsageStats: {
    totalRequests: number;
    mostUsedFeature: string;
    costEstimate: number;
  };
}

interface ApiResponse {
  success: boolean;
  stats: DocumentStats;
  error?: string;
}

export default function StatsCard({ className }: StatsCardProps) {
  const { stats: userStoreStats, plan } = useUserStore();
  const { data: session } = useSession();
  const [apiStats, setApiStats] = React.useState<DocumentStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // API에서 통계 데이터 가져오기
  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (session?.user?.id) {
        params.append('user_id', session.user.id);
      }

      const response = await fetch(`/api/documents/stats?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setApiStats(data.stats);
      } else {
        setError(data.error || '데이터를 가져오는데 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Stats fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  React.useEffect(() => {
    if (session?.user?.id) {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, fetchStats]);

  const formatDate = (date: Date | string) => {
    if (!isClient) return '로딩 중...';
    
    try {
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    } catch (error) {
      return '날짜 오류';
    }
  };

  // 이번 주 활동 계산
  const getThisWeekActivity = () => {
    if (!apiStats?.weeklyActivity) return 0;
    return apiStats.weeklyActivity.reduce((sum, day) => sum + day.count, 0);
  };

  // 연속 사용일 계산
  const getUsageStreakDays = () => {
    if (!apiStats?.weeklyActivity) return 0;
    
    let streak = 0;
    const activities = [...apiStats.weeklyActivity].reverse();
    
    for (const activity of activities) {
      if (activity.count > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  // 자주 사용하는 카테고리 계산
  const getFavoriteCategories = () => {
    if (!apiStats?.documentsByCategory) return [];
    
    const categories = Object.entries(apiStats.documentsByCategory)
      .filter(([_, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => {
        // 카테고리명을 한국어로 변환
        const categoryNames: Record<string, string> = {
          'business-email': '비즈니스 이메일',
          'personal-letter': '개인 편지',
          'thank-you': '감사 인사',
          'apology-message': '사과 메시지',
          'casual-message': '일반 메시지'
        };
        return categoryNames[category] || category;
      });
    
    return categories.length > 0 ? categories : ['아직 문서가 없습니다'];
  };

  const statItems = [
    {
      icon: FileText,
      label: '총 작성 문서',
      value: apiStats ? apiStats.totalDocuments.toLocaleString() : '0',
      change: `+${getThisWeekActivity()}`,
      changeLabel: '이번 주',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Zap,
      label: 'AI 요청 총합',
      value: apiStats ? apiStats.aiUsageStats.totalRequests.toLocaleString() : '0',
      change: apiStats?.aiUsageStats.mostUsedFeature || 'none',
      changeLabel: '주요 기능',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: TrendingUp,
      label: '평균 단어 수',
      value: apiStats ? Math.round(apiStats.avgWordsPerDocument).toLocaleString() : '0',
      change: apiStats ? `${apiStats.totalWords.toLocaleString()}` : '0',
      changeLabel: '총 단어',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Target,
      label: '연속 사용일',
      value: `${getUsageStreakDays()}일`,
      change: '🔥',
      changeLabel: '연속 기록',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  if (loading) {
    return (
      <div className={`bg-card rounded-lg border border-border ${className}`}>
        <div className="p-6 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-muted-foreground">통계 데이터 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-card rounded-lg border border-border ${className}`}>
        <div className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">⚠️ 오류 발생</div>
            <div className="text-sm text-muted-foreground mb-4">{error}</div>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-lg border border-border ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                활동 통계
              </h3>
              <p className="text-sm text-muted-foreground">
                당신의 프롬 사용 현황을 확인해보세요
              </p>
            </div>
          </div>
          <button
            onClick={fetchStats}
            className="p-2 text-muted-foreground hover:text-foreground"
            title="새로고침"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 ${item.bgColor} rounded-lg`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">
                    {item.changeLabel}
                  </div>
                  <div className="text-xs font-medium text-green-600">
                    {item.change}
                  </div>
                </div>
              </div>
              
              <div className="text-2xl font-bold text-foreground mb-1">
                {item.value}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Favorite Categories */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            자주 사용하는 카테고리
          </h4>
          
          <div className="space-y-2">
            {getFavoriteCategories().map((category, index) => (
              <div
                key={category}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-sm text-foreground">{category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-xs text-muted-foreground">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document Status Overview */}
        {apiStats && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              문서 상태별 현황
            </h4>
            
            <div className="space-y-3">
              {Object.entries(apiStats.documentsByStatus).map(([status, count]) => {
                const statusNames: Record<string, string> = {
                  'draft': '초안',
                  'published': '발행됨',
                  'archived': '보관됨'
                };
                
                const statusName = statusNames[status] || status;
                
                return (
                  <div key={status} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      status === 'published' ? 'bg-green-500' : 
                      status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1">
                      <div className="text-sm text-foreground">
                        {statusName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {count}개 문서
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Weekly Activity Chart */}
        {apiStats?.weeklyActivity && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              주간 활동 (최근 7일)
            </h4>
            
            <div className="flex items-end justify-between h-20 gap-1">
              {apiStats.weeklyActivity.map((day, index) => {
                const maxCount = Math.max(...apiStats.weeklyActivity.map(d => d.count), 1);
                const height = (day.count / maxCount) * 100;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.1 }}
                      className="w-full bg-primary rounded-t min-h-[2px]"
                      title={`${day.date}: ${day.count}개`}
                    />
                    <div className="text-xs text-muted-foreground">
                      {new Date(day.date).getDate()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Cost Estimate */}
        {apiStats?.aiUsageStats && (
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              AI 사용 현황
            </h4>
            
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">예상 비용</span>
                <span className="text-sm font-medium text-foreground">
                  ₩{apiStats.aiUsageStats.costEstimate.toLocaleString()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                총 {apiStats.aiUsageStats.totalRequests.toLocaleString()}회 요청
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}