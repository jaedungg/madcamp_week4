import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { generateOrderId, calculatePlanAmount } from '@/lib/payment-utils';
import { CreatePaymentOrderRequest, CreatePaymentOrderResponse } from '@/types/payment';

// 요청 검증 스키마
const createOrderSchema = z.object({
  orderId: z.string().optional(),
  planType: z.enum(['premium', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).optional().default('monthly'),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
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
    const validatedData = createOrderSchema.parse(body);
    
    const { planType, billingCycle, customerEmail, customerName } = validatedData;
    const orderId = validatedData.orderId || generateOrderId();
    
    // 결제 금액 계산
    const amount = calculatePlanAmount(planType, billingCycle);
    
    // 중복 주문 확인
    const existingOrder = await prisma.payment_orders.findUnique({
      where: { order_id: orderId }
    });
    
    if (existingOrder) {
      return NextResponse.json(
        { error: '이미 존재하는 주문 ID입니다.' },
        { status: 400 }
      );
    }
    
    // 사용자 확인
    const user = await prisma.users.findUnique({
      where: { id: session.user.id }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // 결제 주문 생성
    const paymentOrder = await prisma.payment_orders.create({
      data: {
        user_id: session.user.id,
        order_id: orderId,
        amount,
        currency: 'KRW',
        plan_type: planType,
        status: 'pending',
        toss_order_name: `${planType === 'premium' ? '프리미엄' : '엔터프라이즈'} 플랜 ${billingCycle === 'monthly' ? '월간' : '연간'} 구독`,
        toss_customer_email: customerEmail,
        toss_customer_name: customerName,
      }
    });
    
    // 응답 생성
    const response: CreatePaymentOrderResponse = {
      id: paymentOrder.id,
      orderId: paymentOrder.order_id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      planType: paymentOrder.plan_type,
      status: paymentOrder.status,
      createdAt: paymentOrder.created_at.toISOString(),
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('결제 주문 생성 오류:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: '잘못된 요청 데이터입니다.',
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: '내부 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // URL 파라미터에서 orderId 추출
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId가 필요합니다.' },
        { status: 400 }
      );
    }
    
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
    
    const response: CreatePaymentOrderResponse = {
      id: paymentOrder.id,
      orderId: paymentOrder.order_id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency,
      planType: paymentOrder.plan_type,
      status: paymentOrder.status,
      createdAt: paymentOrder.created_at.toISOString(),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('결제 주문 조회 오류:', error);
    return NextResponse.json(
      { error: '내부 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}