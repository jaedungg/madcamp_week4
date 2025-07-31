// TossPayments SDK 관련 타입 정의

export interface TossPaymentsConfig {
  clientKey: string;
  customerKey?: string;
}

export interface PaymentAmount {
  currency: 'KRW' | 'USD';
  value: number;
}

export interface PaymentMethodOptions {
  selector: string;
  variantKey?: string;
}

export interface AgreementOptions {
  selector: string;
  variantKey?: string;
}

export interface PaymentRequestOptions {
  orderId: string;
  orderName: string;
  customerEmail?: string;
  customerName?: string;
  successUrl?: string;
  failUrl?: string;
}

// TossPayments 결제 위젯 인터페이스
export interface TossPaymentsWidgets {
  setAmount(amount: PaymentAmount): Promise<void>;
  renderPaymentMethods(options: PaymentMethodOptions): Promise<PaymentMethodWidget>;
  renderAgreement(options: AgreementOptions): Promise<AgreementWidget>;
  requestPayment(options: PaymentRequestOptions): Promise<void>;
}

export interface PaymentMethodWidget {
  getSelectedPaymentMethod(): Promise<SelectedPaymentMethod>;
  on(eventName: 'paymentMethodSelect', callback: (method: SelectedPaymentMethod) => void): void;
  destroy(): Promise<void>;
}

export interface AgreementWidget {
  on(eventName: 'agreementStatusChange', callback: (status: AgreementStatus) => void): void;
  destroy(): Promise<void>;
}

export interface SelectedPaymentMethod {
  code: string;
  type: string;
}

export interface AgreementStatus {
  agreedRequiredTerms: boolean;
}

// API 요청/응답 타입
export interface CreatePaymentOrderRequest {
  orderId: string;
  amount: number;
  planType: 'premium' | 'enterprise';
  customerEmail: string;
  customerName: string;
}

export interface CreatePaymentOrderResponse {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  planType: string;
  status: string;
  createdAt: string;
}

export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface ConfirmPaymentResponse {
  paymentKey: string;
  orderId: string;
  status: string;
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt: string;
  receipt?: {
    url: string;
  };
}

export interface PaymentFailureResponse {
  code: string;
  message: string;
  orderId: string;
}

// 웹훅 타입
export interface TossPaymentsWebhookData {
  eventType: 'PAYMENT_STATUS_CHANGED';
  createdAt: string;
  data: {
    paymentKey: string;
    orderId: string;
    status: 'READY' | 'IN_PROGRESS' | 'WAITING_FOR_DEPOSIT' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'ABORTED' | 'EXPIRED';
    totalAmount: number;
    method: string;
    requestedAt: string;
    approvedAt?: string;
    useEscrow?: boolean;
    cultureExpense?: boolean;
    receipt?: {
      url: string;
    };
    failure?: {
      code: string;
      message: string;
    };
  };
}

// 플랜 정보 타입
export interface PlanPricing {
  planType: 'premium' | 'enterprise';
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: 'KRW';
  features: string[];
  popular?: boolean;
  description?: string;
}

export const PLAN_PRICING: Record<'premium' | 'enterprise', PlanPricing> = {
  premium: {
    planType: 'premium',
    displayName: '프리미엄 플랜',
    monthlyPrice: 19900,
    yearlyPrice: 199000,
    currency: 'KRW',
    features: [
      'AI 글쓰기 도우미',
      '고급 템플릿',
      '무제한 문서 저장',
      '고급 톤 조절',
      '우선 기술 지원',
      '문서 공유 기능',
      '고급 내보내기 옵션',
    ],
    popular: true,
    description: '개인 사용자를 위한 최고의 선택',
  },
  enterprise: {
    planType: 'enterprise',
    displayName: '엔터프라이즈 플랜',
    monthlyPrice: 99000,
    yearlyPrice: 990000,
    currency: 'KRW',
    features: [
      '모든 프리미엄 기능',
      '팀 협업 도구',
      '고급 분석',
      '전담 지원',
      'API 액세스',
      '커스텀 통합',
      '엔터프라이즈 보안',
    ],
    description: '팀과 기업을 위한 강력한 솔루션',
  },
};

// 에러 타입
export interface PaymentError {
  code: string;
  message: string;
  details?: string;
}

export class TossPaymentError extends Error {
  code: string;
  details?: string;

  constructor(code: string, message: string, details?: string) {
    super(message);
    this.name = 'TossPaymentError';
    this.code = code;
    this.details = details;
  }
}

// 유틸리티 타입
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'canceled' | 'refunded';
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'pending';
export type BillingCycle = 'monthly' | 'yearly';

export interface PaymentSummary {
  planType: 'premium' | 'enterprise';
  billingCycle: BillingCycle;
  amount: number;
  discount?: number;
  finalAmount: number;
  currency: 'KRW';
  nextBillingDate?: Date;
}