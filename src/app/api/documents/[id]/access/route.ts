// app/api/documents/[id]/access/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 요청 본문 타입 정의
interface AccessLogRequest {
  user_id: string;
  time_spent?: number;
}

// 응답 타입 정의
interface AccessLogResponse {
  success: boolean;
  error?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<AccessLogResponse>> {
  try {
    const { id: documentId } = await params; // Await params and rename id to documentId
    // 요청 본문 파싱 및 검증
    const body: AccessLogRequest = await req.json();
    const { user_id, time_spent = 0 } = body;

    // 필수 필드 검증
    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'user_id is required' },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(documentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    if (!uuidRegex.test(user_id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // time_spent 값 검증 및 정규화
    const normalizedTimeSpent = Math.max(0, Math.round(time_spent));

    // 문서 존재 여부 확인
    const document = await prisma.documents.findUnique({
      where: { id: documentId },
      select: { id: true, user_id: true }, // 필요한 필드만 선택
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // 사용자 권한 확인 (문서 소유자이거나 공유된 문서인지)
    if (document.user_id !== user_id) {
      // 공유된 문서인지 확인
      const sharedDocument = await prisma.document_shares.findFirst({
        where: {
          document_id: documentId,
          is_active: true,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      });

      if (!sharedDocument) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // 접근 로그 생성
    await prisma.document_access_logs.create({
      data: {
        document_id: documentId,
        user_id: user_id,
        time_spent: normalizedTimeSpent,
        accessed_at: new Date(),
      }
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error logging document access:', error);
    
    // Prisma 에러 처리
    if (error instanceof Error) {
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { success: false, error: 'Invalid user ID or document ID' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}