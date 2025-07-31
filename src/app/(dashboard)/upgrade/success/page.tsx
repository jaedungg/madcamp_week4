'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Crown, Building2, ArrowRight, Receipt, Calendar } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { LoadingCard } from '@/components/upgrade/LoadingSpinner';
import { ConfirmPaymentResponse } from '@/types/payment';
import { useSetUserSubscription, PLAN_TEMPLATES } from '@/stores/userStore';
import { formatPaymentAmount } from '@/lib/tossPayments';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const setSubscription = useSetUserSubscription();

  const [isProcessing, setIsProcessing] = useState(true);
  const [paymentResult, setPaymentResult] = useState<ConfirmPaymentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');

  useEffect(() => {
    const confirmPayment = async () => {
      if (!paymentKey || !orderId || !amount || !session?.user?.id) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setPaymentResult(data);
          
          // 구독 정보 업데이트 (실제로는 웹훅에서 처리되지만 즉시 UI 업데이트를 위해)
          // 여기서는 간단히 premium으로 설정
          const newSubscription = {
            id: 'temp-id',
            planType: 'premium' as const,
            status: 'active' as const,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30일 후
            autoRenew: true,
          };
          setSubscription(newSubscription);
        } else {
          setError(data.error || '결제 승인에 실패했습니다.');
        }
      } catch (err) {
        console.error('결제 승인 오류:', err);
        setError('결제 승인 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [paymentKey, orderId, amount, session?.user?.id, setSubscription]);

  if (isProcessing) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <LoadingCard 
              title="결제를 승인하고 있습니다..." 
              message="잠시만 기다려주세요. 곧 완료됩니다."
            />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-8">
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-400 mb-4">
                결제 승인 실패
              </h2>
              <p className="text-red-700 dark:text-red-300 mb-6">
                {error}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => router.push('/upgrade')}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  다시 시도하기
                </button>
                <button
                  onClick={() => router.push('/profile')}
                  className="border border-red-600 text-red-600 px-6 py-3 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  프로필로 돌아가기
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getPlanIcon = () => {
    // paymentResult에서 플랜 타입을 추정 (실제로는 서버에서 받아와야 함)
    return <Crown className="w-12 h-12 text-blue-600" />;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            {/* 성공 애니메이션 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute inset-0 bg-green-500 rounded-full"
                />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
              결제가 완료되었습니다!
            </h1>
            <p className="text-lg text-muted-foreground">
              프리미엄 플랜으로 업그레이드되었습니다. 지금부터 모든 기능을 이용하실 수 있습니다.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 결제 정보 */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-6 border border-green-200 dark:border-green-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <Receipt className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-foreground">결제 내역</h3>
              </div>

              {paymentResult && (
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">결제 금액</span>
                    <span className="font-medium text-foreground">
                      {formatPaymentAmount(paymentResult.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">결제 수단</span>
                    <span className="font-medium text-foreground">{paymentResult.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">결제 일시</span>
                    <span className="font-medium text-foreground">
                      {new Date(paymentResult.approvedAt).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">주문 번호</span>
                    <span className="font-medium text-foreground font-mono text-sm">
                      {paymentResult.orderId}
                    </span>
                  </div>
                </div>
              )}

              {paymentResult?.receipt && (
                <div className="mt-6">
                  <a
                    href={paymentResult.receipt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                  >
                    <Receipt className="w-4 h-4" />
                    영수증 보기
                  </a>
                </div>
              )}
            </motion.div>

            {/* 플랜 정보 */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3 mb-6">
                {getPlanIcon()}
                <h3 className="text-lg font-semibold text-foreground">프리미엄 플랜</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    30일 무료 체험 후 월 19,900원
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-foreground mb-2">포함된 기능:</h4>
                  {PLAN_TEMPLATES.premium.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">
                    + 더 많은 고급 기능들
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 다음 단계 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">
              이제 프리미엄 기능을 사용해보세요!
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/editor')}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                AI 에디터 사용하기
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors"
              >
                프로필 보기
              </button>
            </div>

            <p className="text-sm text-muted-foreground mt-4">
              결제 영수증이 등록하신 이메일로 발송되었습니다.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <LoadingCard title="결과 확인 중..." />
          </div>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}