'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Crown, 
  ArrowUpRight, 
  Check,
  Zap,
  Shield,
  Sparkles
} from 'lucide-react';
import { useUserStore, getPlanColor, getUsageColor } from '@/stores/userStore';

interface PlanCardProps {
  className?: string;
}

export default function PlanCard({ className }: PlanCardProps) {
  const { plan, stats } = useUserStore();
  const documentsUsed = useUserStore((state) => state.stats.documentsCreated);
  const documentsLimit = useUserStore((state) => state.plan.maxDocuments);
  const aiRequestsUsed = useUserStore((state) => state.stats.aiRequestsThisMonth);
  const aiRequestsLimit = useUserStore((state) => state.plan.maxAiRequestsPerMonth);

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
          {current.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
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
        {percentage.toFixed(1)}% 사용
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
                  {new Date(plan.expiresAt).toLocaleDateString('ko-KR')}까지
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

        {/* Usage Warning */}
        {(documentsProgress > 80 || aiRequestsProgress > 80) && (
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-orange-100 dark:bg-orange-900/50 rounded">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-1">
                  사용량 한도 임박
                </h5>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  이번 달 한도에 거의 도달했습니다. 플랜을 업그레이드하거나 다음 달을 기다려주세요.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}