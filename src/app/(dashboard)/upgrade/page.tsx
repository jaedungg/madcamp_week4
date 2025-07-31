'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import PlanSelector from '@/components/upgrade/PlanSelector';
import OrderSummary from '@/components/upgrade/OrderSummary';
import PaymentWidget from '@/components/upgrade/PaymentWidget';
import { LoadingCard } from '@/components/upgrade/LoadingSpinner';
import { BillingCycle, PaymentSummary } from '@/types/payment';
import { createPaymentSummary } from '@/lib/tossPayments';
import { useUserPlan, useCanUpgrade } from '@/stores/userStore';

export default function UpgradePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const currentPlan = useUserPlan();
  const { canUpgradeToPremium, canUpgradeToEnterprise } = useCanUpgrade();

  const [step, setStep] = useState<'plan' | 'payment'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'enterprise' | null>(null);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>('monthly');

  // 결제 요약 정보 계산
  const paymentSummary: PaymentSummary | null = useMemo(() => {
    if (!selectedPlan) return null;
    
    const discountPercent = selectedBillingCycle === 'yearly' ? 20 : 0;
    return createPaymentSummary(selectedPlan, selectedBillingCycle, discountPercent);
  }, [selectedPlan, selectedBillingCycle]);

  // 로딩 상태
  if (status === 'loading') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <LoadingCard 
              title="계정 정보 확인 중..." 
              message="잠시만 기다려주세요."
            />
          </div>
        </div>
      </div>
    );
  }

  // 인증되지 않은 사용자
  if (!session) {
    router.push('/login');
    return null;
  }

  // 이미 최고 플랜인 경우
  if (currentPlan.type === 'enterprise') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/profile')}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">플랜 업그레이드</h1>
              <p className="text-muted-foreground mt-1">더 강력한 기능으로 업그레이드하세요</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-8 mb-8">
              <Crown className="w-16 h-16 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">이미 최고 플랜을 이용 중입니다!</h2>
              <p className="text-purple-100">
                엔터프라이즈 플랜의 모든 기능을 마음껏 사용하세요.
              </p>
            </div>
            
            <button
              onClick={() => router.push('/profile')}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              프로필로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handlePlanSelect = (plan: 'premium' | 'enterprise') => {
    // 업그레이드 가능한지 확인
    if (plan === 'premium' && !canUpgradeToPremium) {
      return;
    }
    if (plan === 'enterprise' && !canUpgradeToEnterprise) {
      return;
    }
    
    setSelectedPlan(plan);
  };

  const handleContinueToPayment = () => {
    if (selectedPlan && paymentSummary) {
      setStep('payment');
    }
  };

  const handlePaymentSuccess = (paymentKey: string, orderId: string) => {
    router.push(`/upgrade/success?paymentKey=${paymentKey}&orderId=${orderId}`);
  };

  const handlePaymentFailure = (error: string) => {
    router.push(`/upgrade/failure?error=${encodeURIComponent(error)}`);
  };

  const handleBackToPlan = () => {
    setStep('plan');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={step === 'payment' ? handleBackToPlan : () => router.push('/profile')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">플랜 업그레이드</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              {step === 'plan' 
                ? '더 강력한 기능으로 업그레이드하세요' 
                : '결제 정보를 입력해주세요'
              }
            </p>
          </div>
        </div>

        {/* 단계 표시 */}
        <div className="flex items-center gap-2">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
            ${step === 'plan' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-green-500 text-white'
            }
          `}>
            1
          </div>
          <div className="w-8 h-0.5 bg-border"></div>
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
            ${step === 'payment' 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
            }
          `}>
            2
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {step === 'plan' ? (
            /* 플랜 선택 단계 */
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 플랜 선택 (2/3 너비) */}
                <div className="lg:col-span-2">
                  <PlanSelector
                    selectedPlan={selectedPlan}
                    selectedBillingCycle={selectedBillingCycle}
                    onPlanSelect={handlePlanSelect}
                    onBillingCycleChange={setSelectedBillingCycle}
                  />
                </div>

                {/* 주문 요약 (1/3 너비) */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <OrderSummary paymentSummary={paymentSummary} />
                    
                    {selectedPlan && paymentSummary && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-6"
                      >
                        <button
                          onClick={handleContinueToPayment}
                          className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-md"
                        >
                          결제하기
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* 결제 단계 */
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 결제 위젯 (2/3 너비) */}
                <div className="lg:col-span-2">
                  {paymentSummary && (
                    <PaymentWidget
                      paymentSummary={paymentSummary}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentFailure={handlePaymentFailure}
                    />
                  )}
                </div>

                {/* 최종 주문 요약 (1/3 너비) */}
                <div className="lg:col-span-1">
                  <div className="sticky top-6">
                    <OrderSummary paymentSummary={paymentSummary} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}