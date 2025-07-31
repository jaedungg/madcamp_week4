'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Building2, Calendar, CreditCard, Shield } from 'lucide-react';
import { PLAN_PRICING, BillingCycle, PaymentSummary } from '@/types/payment';
import { formatPaymentAmount } from '@/lib/tossPayments';
import { cn } from '@/lib/utils';

interface OrderSummaryProps {
  paymentSummary: PaymentSummary | null;
  className?: string;
}

export default function OrderSummary({ paymentSummary, className }: OrderSummaryProps) {
  if (!paymentSummary) {
    return (
      <div className={cn('border border-border rounded-lg p-6', className)}>
        <div className="text-center text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>플랜을 선택하면 주문 요약이 표시됩니다.</p>
        </div>
      </div>
    );
  }

  const plan = PLAN_PRICING[paymentSummary.planType];
  const isYearly = paymentSummary.billingCycle === 'yearly';
  
  const getPlanIcon = () => {
    return paymentSummary.planType === 'premium' ? (
      <Crown className="w-5 h-5 text-blue-600" />
    ) : (
      <Building2 className="w-5 h-5 text-purple-600" />
    );
  };

  const getPlanColor = () => {
    return paymentSummary.planType === 'premium' 
      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
      : 'text-purple-600 bg-purple-50 dark:bg-purple-900/20';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('border border-border rounded-lg overflow-hidden', className)}
    >
      {/* 헤더 */}
      <div className="bg-muted/50 px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          주문 요약
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* 선택된 플랜 */}
        <div className="flex items-start gap-4">
          <div className={cn('p-2 rounded-lg', getPlanColor())}>
            {getPlanIcon()}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground">{plan.displayName}</h4>
            <p className="text-sm text-muted-foreground">{plan.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {isYearly ? '연간 구독' : '월간 구독'}
              </span>
            </div>
          </div>
        </div>

        {/* 가격 분석 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-foreground">
              {plan.displayName} ({isYearly ? '연간' : '월간'})
            </span>
            <span className="text-foreground font-medium">
              {formatPaymentAmount(paymentSummary.amount)}
            </span>
          </div>

          {paymentSummary.discount && paymentSummary.discount > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>할인 ({Math.round((paymentSummary.discount / paymentSummary.amount) * 100)}%)</span>
              <span>-{formatPaymentAmount(paymentSummary.discount)}</span>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span className="text-foreground">총 결제 금액</span>
              <span className="text-foreground">
                {formatPaymentAmount(paymentSummary.finalAmount)}
              </span>
            </div>
            {isYearly && (
              <p className="text-sm text-muted-foreground mt-1">
                월 {formatPaymentAmount(Math.floor(paymentSummary.finalAmount / 12))} 상당
              </p>
            )}
          </div>
        </div>

        {/* 다음 결제일 */}
        {paymentSummary.nextBillingDate && (
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">다음 결제일</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {paymentSummary.nextBillingDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              결제 3일 전에 이메일로 알림을 보내드립니다.
            </p>
          </div>
        )}

        {/* 보안 및 정책 정보 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-green-600" />
            <span>SSL 암호화로 안전하게 보호됩니다</span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 30일 무료 체험 기간 동안 언제든지 취소 가능</p>
            <p>• 구독 취소 시 현재 결제 기간 종료까지 서비스 이용 가능</p>
            <p>• 환불 정책에 따라 부분 환불 가능</p>
          </div>
        </div>

        {/* 주요 기능 미리보기 */}
        <div className="border-t border-border pt-4">
          <h5 className="text-sm font-medium text-foreground mb-3">포함된 주요 기능</h5>
          <div className="space-y-2">
            {plan.features.slice(0, 4).map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
            {plan.features.length > 4 && (
              <p className="text-xs text-muted-foreground">
                + {plan.features.length - 4}개 추가 기능
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}