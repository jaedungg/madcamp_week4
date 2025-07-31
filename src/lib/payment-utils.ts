/**
 * 결제 관련 유틸리티 함수들 (클라이언트/서버 공용)
 * 이 파일의 함수들은 환경변수에 의존하지 않으므로 클라이언트에서도 안전하게 사용할 수 있습니다.
 */

import { PLAN_PRICING, BillingCycle, PaymentSummary } from '@/types/payment';

/**
 * 결제 금액 포맷팅
 * @param amount 금액
 * @param currency 통화 (기본값: KRW)
 * @returns 포맷된 금액 문자열
 */
export function formatPaymentAmount(amount: number, currency: 'KRW' | 'USD' = 'KRW'): string {
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}

/**
 * 플랜별 결제 금액 계산
 * @param planType 플랜 타입
 * @param billingCycle 결제 주기
 * @returns 결제 금액
 */
export function calculatePlanAmount(
  planType: 'premium' | 'enterprise',
  billingCycle: BillingCycle
): number {
  const plan = PLAN_PRICING[planType];
  return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
}

/**
 * 결제 요약 정보 생성
 * @param planType 플랜 타입
 * @param billingCycle 결제 주기
 * @param discountPercent 할인율 (선택사항)
 * @returns 결제 요약 정보
 */
export function createPaymentSummary(
  planType: 'premium' | 'enterprise',
  billingCycle: BillingCycle,
  discountPercent?: number
): PaymentSummary {
  const baseAmount = calculatePlanAmount(planType, billingCycle);
  const discount = discountPercent ? Math.floor(baseAmount * (discountPercent / 100)) : 0;
  const finalAmount = baseAmount - discount;

  // 다음 결제일 계산
  const nextBillingDate = new Date();
  if (billingCycle === 'monthly') {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  } else {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  }

  return {
    planType,
    billingCycle,
    amount: baseAmount,
    discount,
    finalAmount,
    currency: 'KRW',
    nextBillingDate,
  };
}

/**
 * 주문 ID 생성
 * @param prefix 주문 ID 접두사 (기본값: ORDER)
 * @returns 생성된 주문 ID
 */
export function generateOrderId(prefix: string = 'ORDER'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * 결제 상태 검증
 * @param status 결제 상태
 * @returns 유효한 결제 상태인지 여부
 */
export function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ['pending', 'paid', 'failed', 'canceled', 'refunded'];
  return validStatuses.includes(status);
}

/**
 * 전화번호를 TossPayments 형식으로 포맷팅
 * @param phoneNumber 원본 전화번호 (예: "010-1234-5678" 또는 "01012345678")
 * @returns 숫자만 포함된 전화번호 (예: "01012345678") 또는 빈 문자열
 */
export function formatPhoneNumberForTossPayments(phoneNumber?: string): string {
  if (!phoneNumber) {
    return '01065515413';
  }

  // 숫자만 추출
  const numbersOnly = phoneNumber.replace(/\D/g, '');

  // 길이 검증 (최소 8자, 최대 15자)
  if (numbersOnly.length < 8 || numbersOnly.length > 15) {
    return '';
  }

  return numbersOnly;
}

/**
 * 에러 메시지 한국어 변환
 * @param errorCode TossPayments 에러 코드
 * @returns 한국어 에러 메시지
 */
export function getKoreanErrorMessage(errorCode: string): string {
  const errorMessages: Record<string, string> = {
    'INITIALIZATION_FAILED': 'TossPayments 초기화에 실패했습니다.',
    'AMOUNT_SET_FAILED': '결제 금액 설정에 실패했습니다.',
    'RENDER_FAILED': '결제 화면 렌더링에 실패했습니다.',
    'AGREEMENT_RENDER_FAILED': '약관 화면 렌더링에 실패했습니다.',
    'PAYMENT_REQUEST_FAILED': '결제 요청에 실패했습니다.',
    'USER_CANCEL': '사용자가 결제를 취소했습니다.',
    'INVALID_CARD': '유효하지 않은 카드입니다.',
    'INSUFFICIENT_FUNDS': '잔액이 부족합니다.',
    'EXCEED_MAX_DAILY_PAYMENT_COUNT': '일일 결제 한도를 초과했습니다.',
    'NOT_ALLOWED_POINT_USE': '포인트 사용이 허용되지 않습니다.',
    'INVALID_API_KEY': 'API 키가 유효하지 않습니다.',
    'INVALID_REJECT_CARD': '거절된 카드입니다.',
    'BELOW_MINIMUM_AMOUNT': '최소 결제 금액 미만입니다.',
    'EXCEED_MAX_DAILY_PAYMENT_AMOUNT': '일일 결제 금액 한도를 초과했습니다.',
    'NOT_AVAILABLE_BANK': '이용할 수 없는 은행입니다.',
    'INVALID_PASSWORD': '비밀번호가 틀렸습니다.',
    'INCORRECT_BASIC_AUTH': '인증 정보가 올바르지 않습니다.',
    'FDS_ERROR': '위험 거래로 분류되어 결제가 거절되었습니다.',
  };

  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
}