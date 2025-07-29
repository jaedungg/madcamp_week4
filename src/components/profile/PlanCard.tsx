'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  ArrowUpRight, 
  Check,
  Zap,
  Shield,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useUserStore, getPlanColor, getUsageColor } from '@/stores/userStore';

// API 응답 타입 정의 (StatsCard와 동일)
interface WeeklyActivity {
  date: string;
  count: number;
}

interface AIUsageStats {
  totalRequests: number;
  mostUsedFeature: string;
  costEstimate: number;
}

interface DocumentStats {
  totalDocuments: number;
  totalWords: number;
  avgWordsPerDocument: number;
  documentsByCategory: Record<string, number>;
  documentsByStatus: Record<string, number>;
  weeklyActivity: WeeklyActivity[];
  aiUsageStats: AIUsageStats;
}

interface StatsResponse {
  success: boolean;
  stats: DocumentStats;
  error?: string;
}

interface PlanCardProps {
  className?: string;
  userId?: string; // 선택적 사용자 ID
}

export default function PlanCard({ className, userId }: PlanCardProps) {
  const { plan } = useUserStore();
  const [stats, setStats] = React.useState<DocumentStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // API 데이터 가져오기
  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = new URL('/api/documents/stats', window.location.origin);
        if (userId) {
          url.searchParams.append('user_id', userId);
        }

        const response = await fetch(url.toString());
        const data: StatsResponse = await response.json();

        if (!response.ok) {
          throw new Error(data.error || '통계 데이터를 가져오는데 실패했습니다.');
        }

        if (data.success) {
          setStats(data.stats);
        } else {
          throw new Error(data.error || '알 수 없는 오류가 발생했습니다.');
        }
      } catch (err) {
        console.error('Stats fetch error:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (isClient) {
      fetchStats();
    }
  }, [isClient, userId]);

  // API 데이터에서 실제 사용량 가져오기
  const documentsUsed = stats?.totalDocuments || 0;
  const documentsLimit = plan.maxDocuments;
  const aiRequestsUsed = stats?.aiUsageStats.totalRequests || 0;
  const aiRequestsLimit = plan.maxAiRequestsPerMonth;

  const documentsProgress = Math.min((documentsUsed / documentsLimit) * 100, 100);
  const aiRequestsProgress = Math.min((aiRequestsUsed / aiRequestsLimit) * 100, 100);

  const planIcons = {
    free: Sparkles,
    premium: Crown,
    enterprise: Shield,
  };

  const planColors = {
    free: 'from-gray-500 to-gray-600',
    premium: 'from-blue-500 to-purple-600',
    enterprise: 'from-purple-600 to-indigo-700',
  };

  const PlanIcon = planIcons[plan.type];

  const handleUpgrade = () => {
    // 실제 구현에서는 결제 페이지로 이동
    console.log('플랜 업그레이드 클릭');
  };

  const ProgressBar = ({ 
    current, 
    max, 
    percentage, 
    label, 
    icon: Icon 
  }: {
    current: number;
    max: number;
    percentage: number;
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Icon className="w-4 h-4" />
          <span>{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            `${current.toLocaleString()} / ${max.toLocaleString()}`
          )}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: loading ? '0%' : `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-2 rounded-full ${
            percentage >= 90 
              ? 'bg-red-500' 
              : percentage >= 75 
                ? 'bg-orange-500' 
                : 'bg-primary'
          }`}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-right">
        {loading ? '로딩 중...' : `${percentage.toFixed(1)}% 사용`}
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-lg border border-border overflow-hidden ${className}`}
    >
      {/* Plan Header */}
      <div className={`bg-gradient-to-r ${planColors[plan.type]} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <PlanIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{plan.displayName}</h3>
              {plan.expiresAt && (
                <p className="text-sm opacity-90">
                  {isClient && new Date(plan.expiresAt).toLocaleDateString('ko-KR')}까지
                </p>
              )}
            </div>
          </div>
          
          {plan.type === 'free' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpgrade}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <Crown className="w-4 h-4" />
              <span className="text-sm font-medium">업그레이드</span>
              <ArrowUpRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="p-6 space-y-6">
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-4">
            이번 달 사용량
          </h4>
          
          {error ? (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm">사용량을 불러올 수 없습니다</span>
              </div>
              <p className="text-xs text-red-500 dark:text-red-300 mt-1">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <ProgressBar
                current={documentsUsed}
                max={documentsLimit}
                percentage={documentsProgress}
                label="문서 생성"
                icon={Sparkles}
              />
              
              <ProgressBar
                current={aiRequestsUsed}
                max={aiRequestsLimit}
                percentage={aiRequestsProgress}
                label="AI 요청"
                icon={Zap}
              />
            </div>
          )}
        </div>

        {/* Features */}
        <div>
          <h4 className="text-lg font-semibold text-foreground mb-3">
            플랜 기능
          </h4>
          
          <div className="space-y-2">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Notice for Free Plan */}
        {plan.type === 'free' && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-foreground mb-1">
                  프리미엄으로 업그레이드하세요
                </h5>
                <p className="text-sm text-muted-foreground mb-3">
                  무제한 문서, 고급 AI 기능, 우선 지원을 받아보세요.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpgrade}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  프리미엄 시작하기
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Usage Warning - API 데이터 기반 */}
        {!loading && !error && (documentsProgress > 80 || aiRequestsProgress > 80) && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-orange-100 dark:bg-orange-900/50 rounded">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  사용량 한도 임박
                </h5>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-2">
                  이번 달 한도에 거의 도달했습니다.
                </p>
                <div className="text-xs text-orange-600 dark:text-orange-400">
                  {documentsProgress > 80 && (
                    <div>• 문서 생성: {documentsUsed}/{documentsLimit} ({documentsProgress.toFixed(1)}%)</div>
                  )}
                  {aiRequestsProgress > 80 && (
                    <div>• AI 요청: {aiRequestsUsed}/{aiRequestsLimit} ({aiRequestsProgress.toFixed(1)}%)</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">사용량 데이터를 불러오는 중...</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}