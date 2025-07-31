import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';
import {
  TossPaymentsPayment,
  TossPaymentsConfig,
  PaymentAmount,
  PaymentMethodOptions,
  AgreementOptions,
  PaymentRequestOptions,
  TossPaymentError,
} from '@/types/payment';

// 클라이언트 안전 함수들을 payment-utils에서 가져오기
export {
  formatPaymentAmount,
  calculatePlanAmount,
  createPaymentSummary,
  generateOrderId,
  isValidPaymentStatus,
  getKoreanErrorMessage,
  formatPhoneNumberForTossPayments
} from './payment-utils';

// TossPayments 클라이언트 키 (클라이언트 사이드에서 접근 가능)
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
if (!TOSS_CLIENT_KEY) {
  throw new Error('환경변수 NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다.');
}

/**
 * TossPayments SDK 초기화 (결제창 방식)
 * @param customerKey 고객 식별자 (회원인 경우) 또는 ANONYMOUS (비회원인 경우)
 * @returns TossPayments 결제창 객체
 */
export async function initializeTossPayments(customerKey?: string): Promise<TossPaymentsPayment> {
  try {
    const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

    // 회원/비회원 결제 처리
    const payment = tossPayments.payment({
      customerKey: customerKey || ANONYMOUS
    });

    return payment;
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
 * 결제창으로 결제 요청
 * @param payment TossPayments 결제창 객체
 * @param options 결제 요청 옵션
 */
export async function requestPaymentWithWindow(
  payment: TossPaymentsPayment,
  options: PaymentRequestOptions & {
    amount: {
      currency: 'KRW' | 'USD';
      value: number;
    };
    method: 'CARD' | 'TRANSFER' | 'VIRTUAL_ACCOUNT';
  }
): Promise<void> {
  try {
    await payment.requestPayment({
      method: options.method,
      amount: options.amount,
      orderId: options.orderId,
      orderName: options.orderName,
      customerEmail: options.customerEmail,
      customerName: options.customerName,
      customerMobilePhone: options.customerMobilePhone,
      successUrl: options.successUrl,
      failUrl: options.failUrl,
      card: {
        useEscrow: false,
        flowMode: 'DEFAULT',
        useCardPoint: false,
        useAppCardOnly: false,
      },
    });
  } catch (error) {
    console.error('결제 요청 실패:', error);
    throw new TossPaymentError(
      'PAYMENT_REQUEST_FAILED',
      '결제 요청에 실패했습니다.',
      error instanceof Error ? error.message : String(error)
    );
  }
}

// 결제창 방식에서는 UI 렌더링 함수들이 필요하지 않습니다.
// 결제 요청은 requestPaymentWithWindow 함수를 사용하세요.


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