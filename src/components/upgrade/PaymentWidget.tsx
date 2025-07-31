'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Shield, AlertTriangle, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { 
  initializeTossPayments, 
  setPaymentAmount, 
  renderPaymentMethods, 
  renderAgreement,
  requestPayment,
  generateOrderId 
} from '@/lib/tossPayments';
import { 
  TossPaymentsWidgets, 
  PaymentMethodWidget, 
  AgreementWidget,
  PaymentSummary 
} from '@/types/payment';
import { usePaymentActions } from '@/stores/userStore';
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
  const { createPaymentOrder } = usePaymentActions();
  
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [paymentWidget, setPaymentWidget] = useState<PaymentMethodWidget | null>(null);
  const [agreementWidget, setAgreementWidget] = useState<AgreementWidget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [agreementStatus, setAgreementStatus] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);
  const initializeRef = useRef(false);

  // TossPayments 초기화
  useEffect(() => {
    if (initializeRef.current) return;
    initializeRef.current = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const customerKey = session?.user?.id || undefined;
        const tossWidgets = await initializeTossPayments(customerKey);
        
        // 결제 금액 설정
        await setPaymentAmount(tossWidgets, paymentSummary.finalAmount);
        
        setWidgets(tossWidgets);
      } catch (err) {
        console.error('TossPayments 초기화 실패:', err);
        setError('결제 시스템 초기화에 실패했습니다. 페이지를 새로고침해 주세요.');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [paymentSummary.finalAmount, session?.user?.id]);

  // 결제 UI 렌더링
  useEffect(() => {
    if (!widgets || isLoading) return;

    const renderWidgets = async () => {
      try {
        // 결제 수단 위젯 렌더링
        if (paymentMethodRef.current) {
          const paymentMethodWidget = await renderPaymentMethods(
            widgets,
            '#payment-method'
          );
          
          // 결제 수단 선택 이벤트 리스너
          paymentMethodWidget.on('paymentMethodSelect', (method) => {
            console.log('결제 수단 선택:', method);
            setSelectedPaymentMethod(method.code);
          });
          
          setPaymentWidget(paymentMethodWidget);
        }

        // 약관 위젯 렌더링
        if (agreementRef.current) {
          const agreementWidget = await renderAgreement(
            widgets,
            '#agreement'
          );
          
          // 약관 동의 상태 이벤트 리스너
          agreementWidget.on('agreementStatusChange', (status) => {
            console.log('약관 동의 상태:', status);
            setAgreementStatus(status.agreedRequiredTerms);
          });
          
          setAgreementWidget(agreementWidget);
        }
      } catch (err) {
        console.error('결제 위젯 렌더링 실패:', err);
        setError('결제 화면 로딩에 실패했습니다.');
      }
    };

    renderWidgets();

    // 컴포넌트 언마운트 시 위젯 정리
    return () => {
      paymentWidget?.destroy();
      agreementWidget?.destroy();
    };
  }, [widgets, isLoading]);

  // 결제 실행
  const handlePayment = async () => {
    if (!widgets || !session?.user) {
      setError('사용자 인증이 필요합니다.');
      return;
    }

    if (!agreementStatus) {
      setError('약관에 동의해주세요.');
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

      // 결제 요청
      await requestPayment(widgets, {
        orderId,
        orderName: `${paymentSummary.planType === 'premium' ? '프리미엄' : '엔터프라이즈'} 플랜 구독`,
        customerEmail: session.user.email || '',
        customerName: session.user.name || '',
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

        {/* 결제 수단 선택 */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">결제 수단 선택</h4>
          <div 
            id="payment-method" 
            ref={paymentMethodRef}
            className="min-h-[200px] border border-border rounded-lg"
          />
        </div>

        {/* 약관 동의 */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">약관 동의</h4>
          <div 
            id="agreement" 
            ref={agreementRef}
            className="border border-border rounded-lg"
          />
        </div>

        {/* 결제 버튼 */}
        <div className="pt-4">
          <button
            onClick={handlePayment}
            disabled={!agreementStatus || isProcessing}
            className={cn(
              'w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all',
              agreementStatus && !isProcessing
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

          {!agreementStatus && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              결제를 진행하려면 약관에 동의해주세요.
            </p>
          )}
        </div>

        {/* 추가 정보 */}
        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t border-border">
          <p>• 결제 후 즉시 서비스를 이용할 수 있습니다.</p>
          <p>• 30일 무료 체험 기간 동안 언제든지 취소 가능합니다.</p>
          <p>• 문의사항이 있으시면 고객지원팀으로 연락해주세요.</p>
        </div>
      </div>
    </motion.div>
  );
}