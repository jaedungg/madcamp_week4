import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import {
  TossPaymentsWidgets,
  TossPaymentsConfig,
  PaymentAmount,
  PaymentMethodOptions,
  AgreementOptions,
  PaymentRequestOptions,
  TossPaymentError,
  PLAN_PRICING,
  BillingCycle,
  PaymentSummary
} from '@/types/payment';

import { getEnvVar } from './env-validation';

// TossPayments 클라이언트 키 (환경변수에서 가져오기)
const TOSS_CLIENT_KEY = getEnvVar('TOSS_CLIENT_KEY');

/**
 * TossPayments SDK 초기화
 * @param customerKey 고객 식별자 (회원인 경우) 또는 ANONYMOUS (비회원인 경우)
 * @returns TossPayments 위젯 객체
 */
export async function initializeTossPayments(customerKey?: string): Promise<TossPaymentsWidgets> {
  try {
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

    // 회원/비회원 결제 처리
    const widgets = tossPayments.widgets({
      customerKey: customerKey || ANONYMOUS
    });

    return widgets;
  } catch (error) {
    console.error('TossPayments 초기화 실패:', error);
    throw new TossPaymentError(
      'INITIALIZATION_FAILED',
      'TossPayments SDK 초기화에 실패했습니다.',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * 결제 금액 설정
 * @param widgets TossPayments 위젯 객체
 * @param amount 결제 금액
 * @param currency 통화 (기본값: KRW)
 */
export async function setPaymentAmount(
  widgets: TossPaymentsWidgets,
  amount: number,
  currency: 'KRW' | 'USD' = 'KRW'
): Promise<void> {
  try {
    await widgets.setAmount({
      currency,
      value: amount,
    });
  } catch (error) {
    console.error('결제 금액 설정 실패:', error);
    throw new TossPaymentError(
      'AMOUNT_SET_FAILED',
      '결제 금액 설정에 실패했습니다.',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * 결제 UI 렌더링
 * @param widgets TossPayments 위젯 객체
 * @param selector 결제 UI를 렌더링할 DOM 선택자
 * @param variantKey 결제 UI 변형 키 (선택사항)
 */
export async function renderPaymentMethods(
  widgets: TossPaymentsWidgets,
  selector: string,
  variantKey?: string
) {
  try {
    const paymentMethodWidget = await widgets.renderPaymentMethods({
      selector,
      variantKey: variantKey || 'DEFAULT',
    });

    return paymentMethodWidget;
  } catch (error) {
    console.error('결제 UI 렌더링 실패:', error);
    throw new TossPaymentError(
      'RENDER_FAILED',
      '결제 UI 렌더링에 실패했습니다.',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * 약관 UI 렌더링
 * @param widgets TossPayments 위젯 객체
 * @param selector 약관 UI를 렌더링할 DOM 선택자
 * @param variantKey 약관 UI 변형 키 (선택사항)
 */
export async function renderAgreement(
  widgets: TossPaymentsWidgets,
  selector: string,
  variantKey?: string
) {
  try {
    const agreementWidget = await widgets.renderAgreement({
      selector,
      variantKey: variantKey || 'AGREEMENT',
    });

    return agreementWidget;
  } catch (error) {
    console.error('약관 UI 렌더링 실패:', error);
    throw new TossPaymentError(
      'AGREEMENT_RENDER_FAILED',
      '약관 UI 렌더링에 실패했습니다.',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * 결제 요청
 * @param widgets TossPayments 위젯 객체
 * @param options 결제 요청 옵션
 */
export async function requestPayment(
  widgets: TossPaymentsWidgets,
  options: PaymentRequestOptions
): Promise<void> {
  try {
    await widgets.requestPayment(options);
  } catch (error) {
    console.error('결제 요청 실패:', error);
    throw new TossPaymentError(
      'PAYMENT_REQUEST_FAILED',
      '결제 요청에 실패했습니다.',
      error instanceof Error ? error.message : String(error)
    );
  }
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
 * 결제 상태 검증
 * @param status 결제 상태
 * @returns 유효한 결제 상태인지 여부
 */
export function isValidPaymentStatus(status: string): boolean {
  const validStatuses = ['pending', 'paid', 'failed', 'canceled', 'refunded'];
  return validStatuses.includes(status);
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

/**
 * 웹훅 서명 검증
 * @param signature 웹훅 서명
 * @param body 웹훅 본문
 * @param secret 웹훅 시크릿
 * @returns 서명이 유효한지 여부
 */
export function verifyWebhookSignature(
  signature: string,
  body: string,
  secret: string
): boolean {
  // 실제 구현에서는 crypto 모듈을 사용하여 HMAC-SHA256 검증
  // 이는 서버사이드에서만 실행되어야 함
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return signature === expectedSignature;
  } catch (error) {
    console.error('웹훅 서명 검증 실패:', error);
    return false;
  }
}

// 개발 환경에서 사용할 테스트 설정
export const TOSS_TEST_CONFIG = {
  // 테스트 카드 번호들 (TossPayments 공식 문서에서 제공)
  testCardNumbers: {
    success: '4242424242424242',
    failure: '4000000000000002',
    auth_required: '4000002760003184',
  },
} as const;