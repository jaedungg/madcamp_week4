'use client';

import React, { Suspense } from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw, HelpCircle, Phone, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingCard } from '@/components/upgrade/LoadingSpinner';
import { getKoreanErrorMessage } from '@/lib/payment-utils';

function FailurePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorCode = searchParams.get('code') || 'UNKNOWN_ERROR';
  const errorMessage = searchParams.get('message') || '알 수 없는 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId');

  const koreanErrorMessage = getKoreanErrorMessage(errorCode);

  const getErrorDetails = (code: string) => {
    const errorDetails: Record<string, { title: string; description: string; action: string }> = {
      'USER_CANCEL': {
        title: '결제 취소',
        description: '사용자가 결제를 취소했습니다.',
        action: '다시 결제를 진행하시려면 아래 버튼을 클릭해주세요.'
      },
      'INVALID_CARD': {
        title: '카드 정보 오류',
        description: '입력하신 카드 정보가 올바르지 않습니다.',
        action: '카드 정보를 다시 확인하고 결제를 시도해주세요.'
      },
      'INSUFFICIENT_FUNDS': {
        title: '잔액 부족',
        description: '카드 잔액이 부족합니다.',
        action: '다른 결제 수단을 이용하거나 잔액을 충전한 후 다시 시도해주세요.'
      },
      'EXCEED_MAX_DAILY_PAYMENT_COUNT': {
        title: '일일 결제 한도 초과',
        description: '하루 결제 한도를 초과했습니다.',
        action: '내일 다시 시도하거나 다른 결제 수단을 이용해주세요.'
      },
      'EXCEED_MAX_DAILY_PAYMENT_AMOUNT': {
        title: '일일 결제 금액 한도 초과',
        description: '하루 결제 금액 한도를 초과했습니다.',
        action: '내일 다시 시도하거나 다른 결제 수단을 이용해주세요.'
      },
      'NOT_AVAILABLE_BANK': {
        title: '은행 서비스 불가',
        description: '현재 해당 은행의 서비스를 이용할 수 없습니다.',
        action: '다른 은행의 카드나 다른 결제 수단을 이용해주세요.'
      },
      'INVALID_PASSWORD': {
        title: '비밀번호 오류',
        description: '카드 비밀번호가 틀렸습니다.',
        action: '올바른 비밀번호를 입력하고 다시 시도해주세요.'
      },
      'FDS_ERROR': {
        title: '위험 거래 감지',
        description: '보안상의 이유로 결제가 차단되었습니다.',
        action: '고객센터로 문의하거나 다른 결제 수단을 이용해주세요.'
      }
    };

    return errorDetails[code] || {
      title: '결제 실패',
      description: koreanErrorMessage,
      action: '문제가 지속되면 고객센터로 문의해주세요.'
    };
  };

  const errorDetails = getErrorDetails(errorCode);

  const handleRetryPayment = () => {
    router.push('/upgrade');
  };

  const handleContactSupport = () => {
    // 실제로는 고객센터 연결 로직
    window.open('mailto:support@from-ai.com?subject=결제 오류 문의&body=주문번호: ' + (orderId || 'N/A') + '%0A오류코드: ' + errorCode);
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
            {/* 실패 애니메이션 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-6"
            >
              <div className="relative">
                <XCircle className="w-24 h-24 text-red-500 mx-auto" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2, opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="absolute inset-0 bg-red-500 rounded-full"
                />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-foreground mb-4">
              {errorDetails.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {errorDetails.description}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 오류 정보 */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-semibold text-foreground">오류 정보</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">오류 코드</span>
                  <span className="font-mono text-sm bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded text-red-800 dark:text-red-400">
                    {errorCode}
                  </span>
                </div>

                {orderId && (
                  <div>
                    <span className="text-sm text-muted-foreground block mb-1">주문 번호</span>
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded text-foreground">
                      {orderId}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-sm text-muted-foreground block mb-1">발생 시간</span>
                  <span className="text-sm text-foreground">
                    {new Date().toLocaleString('ko-KR')}
                  </span>
                </div>

                <div className="pt-4 border-t border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {errorDetails.action}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* 해결 방법 */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
            >
              <div className="flex items-center gap-3 mb-6">
                <RefreshCw className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-foreground">해결 방법</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">다음을 확인해보세요:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                      카드 정보가 정확한지 확인
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                      카드 잔액이 충분한지 확인
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                      인터넷 연결 상태 확인
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                      다른 결제 수단으로 시도
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-foreground mb-3">여전히 문제가 있나요?</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <span>support@from-ai.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      <span>1588-1234 (평일 9:00-18:00)</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 액션 버튼 */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleRetryPayment}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                다시 결제하기
              </button>
              
              <button
                onClick={handleContactSupport}
                className="border border-border text-foreground px-6 py-3 rounded-lg font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                고객센터 문의
              </button>
              
              <button
                onClick={() => router.push('/profile')}
                className="text-muted-foreground px-6 py-3 rounded-lg font-medium hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                프로필로 돌아가기
              </button>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              결제는 진행되지 않았으며, 어떠한 요금도 청구되지 않습니다.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function FailurePage() {
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
      <FailurePageContent />
    </Suspense>
  );
}