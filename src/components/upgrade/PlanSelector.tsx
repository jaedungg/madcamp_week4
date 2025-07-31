'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Building2 } from 'lucide-react';
import { PLAN_PRICING, BillingCycle } from '@/types/payment';
import { formatPaymentAmount } from '@/lib/tossPayments';
import { cn } from '@/lib/utils';

interface PlanSelectorProps {
  selectedPlan: 'premium' | 'enterprise' | null;
  selectedBillingCycle: BillingCycle;
  onPlanSelect: (plan: 'premium' | 'enterprise') => void;
  onBillingCycleChange: (cycle: BillingCycle) => void;
  className?: string;
}

export default function PlanSelector({
  selectedPlan,
  selectedBillingCycle,
  onPlanSelect,
  onBillingCycleChange,
  className
}: PlanSelectorProps) {
  const plans = [PLAN_PRICING.premium, PLAN_PRICING.enterprise];

  const getDiscountPercentage = (plan: typeof PLAN_PRICING.premium) => {
    if (selectedBillingCycle === 'yearly') {
      const monthlyTotal = plan.monthlyPrice * 12;
      const yearlyPrice = plan.yearlyPrice;
      return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100);
    }
    return 0;
  };

  const getPlanPrice = (plan: typeof PLAN_PRICING.premium) => {
    return selectedBillingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getPlanIcon = (planType: 'premium' | 'enterprise') => {
    return planType === 'premium' ? (
      <Crown className="w-6 h-6" />
    ) : (
      <Building2 className="w-6 h-6" />
    );
  };

  const getPlanColor = (planType: 'premium' | 'enterprise') => {
    return planType === 'premium' 
      ? 'bg-blue-500 text-white border-blue-500' 
      : 'bg-purple-500 text-white border-purple-500';
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 결제 주기 선택 */}
      <div className="flex justify-center">
        <div className="bg-muted rounded-lg p-1 flex">
          <button
            onClick={() => onBillingCycleChange('monthly')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all',
              selectedBillingCycle === 'monthly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            월간 결제
          </button>
          <button
            onClick={() => onBillingCycleChange('yearly')}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all relative',
              selectedBillingCycle === 'yearly'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            연간 결제
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              20% 할인
            </span>
          </button>
        </div>
      </div>

      {/* 플랜 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.planType;
          const price = getPlanPrice(plan);
          const discount = getDiscountPercentage(plan);
          
          return (
            <motion.div
              key={plan.planType}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'relative border-2 rounded-lg p-6 cursor-pointer transition-all',
                isSelected 
                  ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                  : 'border-border hover:border-primary/50 hover:shadow-md'
              )}
              onClick={() => onPlanSelect(plan.planType)}
            >
              {/* 인기 플랜 배지 */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    getPlanColor(plan.planType)
                  )}>
                    인기
                  </div>
                </div>
              )}

              {/* 선택 체크 */}
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <div className="bg-primary text-primary-foreground rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              )}

              {/* 플랜 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  plan.planType === 'premium' 
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                )}>
                  {getPlanIcon(plan.planType)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {plan.displayName}
                  </h3>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  )}
                </div>
              </div>

              {/* 가격 */}
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-foreground">
                    {formatPaymentAmount(price)}
                  </span>
                  <span className="text-muted-foreground">
                    / {selectedBillingCycle === 'monthly' ? '월' : '년'}
                  </span>
                </div>
                
                {discount > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPaymentAmount(plan.monthlyPrice * (selectedBillingCycle === 'yearly' ? 12 : 1))}
                    </span>
                    <span className="text-sm text-green-600 font-medium">
                      {discount}% 절약
                    </span>
                  </div>
                )}
                
                {selectedBillingCycle === 'yearly' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    월 {formatPaymentAmount(Math.floor(price / 12))} 상당
                  </p>
                )}
              </div>

              {/* 기능 목록 */}
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="bg-green-100 text-green-600 rounded-full p-0.5 dark:bg-green-900/20 dark:text-green-400">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm text-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* 선택 버튼 */}
              <div className="mt-6">
                <button
                  className={cn(
                    'w-full py-3 px-4 rounded-lg font-medium transition-all',
                    isSelected
                      ? getPlanColor(plan.planType)
                      : 'border border-border text-foreground hover:bg-muted'
                  )}
                >
                  {isSelected ? '선택됨' : '선택하기'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 추가 정보 */}
      <div className="text-center text-sm text-muted-foreground">
        <p>모든 플랜에는 30일 무료 체험이 포함됩니다.</p>
        <p>언제든지 취소할 수 있으며, 환불 정책이 적용됩니다.</p>
      </div>
    </div>
  );
}