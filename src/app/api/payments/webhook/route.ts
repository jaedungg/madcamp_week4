import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/tossPayments';
import { TossPaymentsWebhookData } from '@/types/payment';

const TOSS_WEBHOOK_SECRET = process.env.TOSS_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  try {
    // 웹훅 서명 검증
    const signature = req.headers.get('toss-signature');
    const body = await req.text();
    
    if (!signature) {
      console.error('웹훅 서명이 없습니다.');
      return NextResponse.json(
        { error: '웹훅 서명이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 서명 검증 (개발 환경에서는 스킵)
    if (process.env.NODE_ENV === 'production' && TOSS_WEBHOOK_SECRET) {
      const isValidSignature = verifyWebhookSignature(signature, body, TOSS_WEBHOOK_SECRET);
      if (!isValidSignature) {
        console.error('유효하지 않은 웹훅 서명입니다.');
        return NextResponse.json(
          { error: '유효하지 않은 웹훅 서명입니다.' },
          { status: 401 }
        );
      }
    }
    
    // 웹훅 데이터 파싱
    const webhookData: TossPaymentsWebhookData = JSON.parse(body);
    
    console.log('TossPayments 웹훅 수신:', {
      eventType: webhookData.eventType,
      orderId: webhookData.data.orderId,
      status: webhookData.data.status,
    });
    
    // 이벤트 타입별 처리
    switch (webhookData.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChange(webhookData.data);
        break;
      default:
        console.log('처리되지 않는 웹훅 이벤트:', webhookData.eventType);
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    return NextResponse.json(
      { error: '웹훅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

async function handlePaymentStatusChange(data: TossPaymentsWebhookData['data']) {
  try {
    const { paymentKey, orderId, status, totalAmount, method, approvedAt, failure } = data;
    
    // 결제 주문 조회
    const paymentOrder = await prisma.payment_orders.findUnique({
      where: { order_id: orderId },
      include: { users: true }
    });
    
    if (!paymentOrder) {
      console.error('결제 주문을 찾을 수 없습니다:', orderId);
      return;
    }
    
    // TossPayments 상태를 내부 상태로 변환
    let internalStatus: string;
    switch (status) {
      case 'DONE':
        internalStatus = 'paid';
        break;
      case 'CANCELED':
      case 'PARTIAL_CANCELED':
        internalStatus = 'canceled';
        break;
      case 'ABORTED':
      case 'EXPIRED':
        internalStatus = 'failed';
        break;
      default:
        internalStatus = 'pending';
    }
    
    // 이미 처리된 상태인지 확인
    if (paymentOrder.status === internalStatus) {
      console.log('이미 처리된 결제 상태:', orderId, internalStatus);
      return;
    }
    
    console.log('결제 상태 업데이트:', {
      orderId,
      oldStatus: paymentOrder.status,
      newStatus: internalStatus,
    });
    
    // 데이터베이스 트랜잭션으로 상태 업데이트
    await prisma.$transaction(async (prisma) => {
      // 1. 결제 주문 상태 업데이트
      const updateData: any = {
        payment_key: paymentKey,
        status: internalStatus,
        payment_method: method,
        failure_reason: failure ? failure.message : null,
        updated_at: new Date(),
      };
      
      if (status === 'DONE' && approvedAt) {
        updateData.paid_at = new Date(approvedAt);
      } else if (status === 'CANCELED') {
        updateData.canceled_at = new Date();
      }
      
      await prisma.payment_orders.update({
        where: { id: paymentOrder.id },
        data: updateData
      });
      
      // 2. 결제 성공 시 구독 처리
      if (internalStatus === 'paid') {
        await handleSuccessfulPayment(paymentOrder, prisma);
      }
      
      // 3. 결제 실패/취소 시 구독 처리
      if (internalStatus === 'failed' || internalStatus === 'canceled') {
        await handleFailedPayment(paymentOrder, prisma);
      }
    });
    
  } catch (error) {
    console.error('결제 상태 변경 처리 오류:', error);
    throw error;
  }
}

async function handleSuccessfulPayment(paymentOrder: any, prisma: any) {
  try {
    const userId = paymentOrder.user_id;
    const planType = paymentOrder.plan_type as 'premium' | 'enterprise';
    
    // 만료일 계산 (월간 구독 기준)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    // 기존 활성 구독 확인
    const existingSubscription = await prisma.subscriptions.findFirst({
      where: {
        user_id: userId,
        status: 'active'
      }
    });
    
    if (existingSubscription) {
      // 기존 구독 취소
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
        user_id: userId,
        plan_type: planType,
        status: 'active',
        started_at: new Date(),
        expires_at: expiresAt,
        auto_renew: true,
      }
    });
    
    console.log('구독이 성공적으로 생성되었습니다:', {
      userId,
      planType,
      expiresAt: expiresAt.toISOString(),
    });
    
  } catch (error) {
    console.error('성공적인 결제 처리 오류:', error);
    throw error;
  }
}

async function handleFailedPayment(paymentOrder: any, prisma: any) {
  try {
    const userId = paymentOrder.user_id;
    
    // 해당 결제와 연관된 pending 구독이 있다면 제거
    await prisma.subscriptions.deleteMany({
      where: {
        user_id: userId,
        status: 'pending',
        created_at: {
          gte: paymentOrder.created_at
        }
      }
    });
    
    console.log('실패한 결제와 연관된 pending 구독이 정리되었습니다:', {
      userId,
      orderId: paymentOrder.order_id,
    });
    
  } catch (error) {
    console.error('실패한 결제 처리 오류:', error);
    throw error;
  }
}

// GET 메서드는 웹훅 엔드포인트 테스트용
export async function GET() {
  return NextResponse.json({
    message: 'TossPayments 웹훅 엔드포인트가 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
  });
}