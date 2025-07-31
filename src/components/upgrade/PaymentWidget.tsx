'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { 
  initializeTossPayments, 
  requestPaymentWithWindow,
  generateOrderId,
  formatPhoneNumberForTossPayments
} from '@/lib/tossPayments';
import { 
  TossPaymentsPayment,
  PaymentSummary 
} from '@/types/payment';
import { useCreatePaymentOrder } from '@/stores/userStore';
import { cn } from '@/lib/utils';

interface PaymentWidgetProps {
  paymentSummary: PaymentSummary;
  onPaymentSuccess: (paymentKey: string, orderId: string) => void;
  onPaymentFailure: (error: string) => void;
  className?: string;
}

export default function PaymentWidget({
  paymentSummary,
  onPaymentSuccess,
  onPaymentFailure,
  className
}: PaymentWidgetProps) {
  const { data: session } = useSession();
  const createPaymentOrder = useCreatePaymentOrder();
  
  const [payment, setPayment] = useState<TossPaymentsPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const initializeRef = useRef(false);
  
  // 안정적인 값들을 메모이제이션
  const finalAmount = useMemo(() => paymentSummary.finalAmount, [paymentSummary.finalAmount]);
  const userId = useMemo(() => session?.user?.id, [session?.user?.id]);

  // TossPayments 초기화 함수를 메모이제이션
  const initializeTossPaymentsPayment = useCallback(async () => {
    if (initializeRef.current) return;
    initializeRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const customerKey = userId || undefined;
      const tossPayment = await initializeTossPayments(customerKey);
      
      setPayment(tossPayment);
    } catch (err) {
      console.error('TossPayments 초기화 실패:', err);
      setError('결제 시스템 초기화에 실패했습니다. 페이지를 새로고침해 주세요.');
      initializeRef.current = false; // 실패 시 재시도 가능하도록
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // TossPayments 초기화
  useEffect(() => {
    initializeTossPaymentsPayment();
  }, [initializeTossPaymentsPayment]);

  // 결제창 방식에서는 UI 렌더링이 필요하지 않습니다.

  // 결제 실행
  const handlePayment = async () => {
    if (!payment || !session?.user) {
      setError('사용자 인증이 필요합니다.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 결제 주문 생성
      const orderId = generateOrderId();
      await createPaymentOrder(
        paymentSummary.planType,
        paymentSummary.finalAmount
      );

      // 결제창 열기
      await requestPaymentWithWindow(payment, {
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: finalAmount,
        },
        orderId,
        orderName: `${paymentSummary.planType === 'premium' ? '프리미엄' : '엔터프라이즈'} 플랜 구독`,
        customerEmail: session.user.email || '',
        customerName: session.user.name || '',
        customerMobilePhone: formatPhoneNumberForTossPayments(session.user.phone),
        successUrl: `${window.location.origin}/upgrade/success`,
        failUrl: `${window.location.origin}/upgrade/failure`,
      });

    } catch (err) {
      console.error('결제 실행 실패:', err);
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('border border-border rounded-lg p-8', className)}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">결제 시스템을 초기화하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('border border-red-200 rounded-lg p-6 bg-red-50 dark:bg-red-900/10', className)}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <h4 className="text-red-800 dark:text-red-400 font-medium mb-1">
              결제 시스템 오류
            </h4>
            <p className="text-red-700 dark:text-red-300 text-sm">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              페이지 새로고침
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
      transition={{ duration: 0.3 }}
      className={cn('border border-border rounded-lg overflow-hidden', className)}
    >
      {/* 헤더 */}
      <div className="bg-muted/50 px-6 py-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          결제 정보
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* 보안 알림 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-green-50 dark:bg-green-900/10 p-3 rounded-lg">
          <Shield className="w-4 h-4 text-green-600" />
          <span>TossPayments의 보안 결제 시스템으로 안전하게 보호됩니다</span>
        </div>

        {/* 결제창 안내 */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h4 className="text-lg font-semibold text-foreground mb-2">간편한 결제 진행</h4>
          <p className="text-sm text-muted-foreground mb-6">
            '결제하기' 버튼을 누르면 보안 결제창이 열립니다.<br />
            카드, 계좌이체, 간편결제 등 다양한 결제 수단을 선택할 수 있습니다.
          </p>
        </div>

        {/* 결제 버튼 */}
        <div className="pt-4">
          <button
            onClick={handlePayment}
            disabled={isProcessing}
            className={cn(
              'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all',
              !isProcessing
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                결제 처리 중...
              </span>
            ) : (
              `${paymentSummary.finalAmount.toLocaleString()}원 결제하기`
            )}
          </button>
        </div>

        {/* 추가 정보 */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>• 결제 후 즉시 서비스를 이용할 수 있습니다.</p>
          <p>• 30일 무료 체험 기간 동안 언제든지 취소 가능합니다.</p>
          <p>• 문의사항이 있으시면 고객지원팀으로 연락해주세요.</p>
          <p>• 결제창에서 약관 동의 후 결제를 진행해주세요.</p>
        </div>
      </div>
    </motion.div>
  );
}