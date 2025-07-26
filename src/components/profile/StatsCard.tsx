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
  Target
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

interface StatsCardProps {
  className?: string;
}

export default function StatsCard({ className }: StatsCardProps) {
  const { stats, plan } = useUserStore();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const formatDate = (date: Date) => {
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

  const getUsageStreakDays = () => {
    // 실제 구현에서는 연속 사용일 계산 로직
    return 7;
  };

  const getThisWeekRequests = () => {
    // 실제 구현에서는 이번 주 AI 요청 수 계산
    return Math.floor(stats.aiRequestsThisMonth * 0.3);
  };

  const statItems = [
    {
      icon: FileText,
      label: '총 작성 문서',
      value: stats.documentsCreated.toLocaleString(),
      change: '+3',
      changeLabel: '이번 주',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Zap,
      label: '이번 달 AI 요청',
      value: stats.aiRequestsThisMonth.toLocaleString(),
      change: `${getThisWeekRequests()}`,
      changeLabel: '이번 주',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: TrendingUp,
      label: '총 AI 요청',
      value: stats.aiRequestsTotal.toLocaleString(),
      change: '+12%',
      changeLabel: '지난 달 대비',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card rounded-lg border border-border ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
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

        {/* Favorite Features */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            자주 사용하는 기능
          </h4>
          
          <div className="space-y-2">
            {stats.favoriteFeatures.map((feature, index) => (
              <div
                key={feature}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <span className="text-sm text-foreground">{feature}</span>
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

        {/* Recent Activity */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            최근 활동
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="flex-1">
                <div className="text-sm text-foreground">
                  마지막 문서 작성
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(stats.lastActivity)}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <div className="flex-1">
                <div className="text-sm text-foreground">
                  AI 기능 사용
                </div>
                <div className="text-xs text-muted-foreground">
                  이번 달 {stats.aiRequestsThisMonth}회 사용
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Goal Progress */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            이번 달 목표
          </h4>
          
          <div className="space-y-3">
            {/* Documents Goal */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">문서 작성 목표</span>
                <span className="text-xs text-muted-foreground">
                  {Math.min(stats.documentsCreated, 10)}/10
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.documentsCreated / 10) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-2 bg-blue-500 rounded-full"
                />
              </div>
            </div>

            {/* AI Usage Goal */}
            <div className="p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground">AI 활용 목표</span>
                <span className="text-xs text-muted-foreground">
                  {Math.min(stats.aiRequestsThisMonth, 50)}/50
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.aiRequestsThisMonth / 50) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="h-2 bg-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}