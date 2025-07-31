import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { PLAN_TEMPLATES } from '@/stores/userStore';
import { ConfirmPaymentRequest, ConfirmPaymentResponse } from '@/types/payment';

import { getEnvVar } from '@/lib/env-validation';

// TossPayments 서버 API 설정
const TOSS_SECRET_KEY = getEnvVar('TOSS_SECRET_KEY');
const TOSS_API_BASE_URL = 'https://api.tosspayments.com/v1';

// 요청 검증 스키마
const confirmPaymentSchema = z.object({
  paymentKey: z.string(),
  orderId: z.string(),
  amount: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱 및 검증
    const body = await req.json();
    const { paymentKey, orderId, amount } = confirmPaymentSchema.parse(body);
    
    // 결제 주문 조회
    const paymentOrder = await prisma.payment_orders.findFirst({
      where: {
        order_id: orderId,
        user_id: session.user.id
      }
    });
    
    if (!paymentOrder) {
      return NextResponse.json(
        { error: '결제 주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 금액 검증
    if (paymentOrder.amount !== amount) {
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }
    
    // 이미 승인된 결제인지 확인
    if (paymentOrder.status === 'paid') {
      return NextResponse.json(
        { error: '이미 승인된 결제입니다.' },
        { status: 400 }
      );
    }
    
    // TossPayments 결제 승인 API 호출
    const tossResponse = await fetch(`${TOSS_API_BASE_URL}/payments/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount,
      }),
    });
    
    const tossData = await tossResponse.json();
    
    if (!tossResponse.ok) {
      // TossPayments API 오류 처리
      console.error('TossPayments 승인 실패:', tossData);
      
      // 결제 주문 상태를 실패로 업데이트
      await prisma.payment_orders.update({
        where: { id: paymentOrder.id },
        data: {
          status: 'failed',
          failure_reason: tossData.message || '결제 승인 실패',
          updated_at: new Date(),
        }
      });
      
      return NextResponse.json(
        { 
          error: '결제 승인에 실패했습니다.', 
          details: tossData.message 
        },
        { status: 400 }
      );
    }
    
    // 데이터베이스 트랜잭션 시작
    await prisma.$transaction(async (prisma) => {
      // 1. 결제 주문 상태 업데이트
      await prisma.payment_orders.update({
        where: { id: paymentOrder.id },
        data: {
          payment_key: paymentKey,
          status: 'paid',
          payment_method: tossData.method,
          paid_at: new Date(tossData.approvedAt),
          updated_at: new Date(),
        }
      });
      
      // 2. 구독 생성 또는 업데이트
      const planType = paymentOrder.plan_type as 'premium' | 'enterprise';
      
      // 주문명에서 결제 주기 추출 (임시 해결방안)
      const isYearly = paymentOrder.toss_order_name?.includes('연간') ?? false;
      const expiresAt = new Date();
      
      if (isYearly) {
        // 연간 구독: 1년 후 만료
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        // 월간 구독: 1개월 후 만료
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      
      // 기존 구독 확인
      const existingSubscription = await prisma.subscriptions.findFirst({
        where: {
          user_id: session.user.id,
          status: 'active'
        }
      });
      
      if (existingSubscription) {
        // 기존 구독을 취소하고 새 구독 생성
        await prisma.subscriptions.update({
          where: { id: existingSubscription.id },
          data: {
            status: 'canceled',
            canceled_at: new Date(),
            updated_at: new Date(),
          }
        });
      }
      
      // 새 구독 생성
      await prisma.subscriptions.create({
        data: {
          user_id: session.user.id,
          plan_type: planType,
          status: 'active',
          started_at: new Date(),
          expires_at: expiresAt,
          auto_renew: true,
        }
      });
    });
    
    // 응답 생성
    const response: ConfirmPaymentResponse = {
      paymentKey,
      orderId,
      status: tossData.status,
      totalAmount: tossData.totalAmount,
      method: tossData.method,
      requestedAt: tossData.requestedAt,
      approvedAt: tossData.approvedAt,
      receipt: tossData.receipt,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('결제 승인 오류:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: '잘못된 요청 데이터입니다.',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    // 예상치 못한 오류 발생 시 결제 주문 상태를 실패로 업데이트
    try {
      const body = await req.clone().json();
      const { orderId } = body;
      
      if (orderId) {
        await prisma.payment_orders.updateMany({
          where: {
            order_id: orderId,
            status: 'pending'
          },
          data: {
            status: 'failed',
            failure_reason: '서버 오류로 인한 결제 실패',
            updated_at: new Date(),
          }
        });
      }
    } catch (updateError) {
      console.error('결제 상태 업데이트 실패:', updateError);
    }
    
    return NextResponse.json(
      { error: '내부 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}