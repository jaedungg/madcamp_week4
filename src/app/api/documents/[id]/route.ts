import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    console.log('문서 조회 요청:', { documentId: id, userEmail: session.user.email });

    // 이메일을 통해 사용자 UUID 찾기
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    
    if (!user) {
      console.log('사용자를 찾을 수 없음:', session.user.email);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const document = await prisma.documents.findFirst({
      where: { 
        id: id,
        user_id: user.id // UUID로 검색
      },
    })

    console.log('조회된 문서:', { 
      found: !!document, 
      documentId: document?.id,
      contentLength: document?.content?.length || 0,
      title: document?.title 
    });

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, document })
  } catch (err) {
    console.error('문서 조회 오류:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

    // 이메일을 통해 사용자 UUID 찾기
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    // 사용자 소유 문서인지 먼저 확인
    const existingDoc = await prisma.documents.findFirst({
      where: { 
        id: id,
        user_id: user.id // UUID로 검색
      }
    })

    if (!existingDoc) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const document = await prisma.documents.update({
      where: { id: id },
      data: {
        ...parsed.data,
        updated_at: new Date(),
        last_modified_at: new Date(),
      },
    })

    return NextResponse.json({ success: true, document })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('DELETE 요청 시작');
    
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    console.log('세션 정보:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email 
    });
    
    if (!session?.user?.email) {
      console.log('인증 실패: 세션이 없음');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    console.log('삭제할 문서 ID:', id);

    // 이메일을 통해 사용자 UUID 찾기
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    
    if (!user) {
      console.log('사용자를 찾을 수 없음');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 사용자 소유 문서인지 먼저 확인
    const existingDoc = await prisma.documents.findFirst({
      where: { 
        id: id,
        user_id: user.id // UUID로 검색
      }
    })

    console.log('기존 문서 확인:', { 
      found: !!existingDoc, 
      documentId: existingDoc?.id,
      documentUserId: existingDoc?.user_id 
    });

    if (!existingDoc) {
      console.log('문서를 찾을 수 없음');
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    await prisma.documents.delete({
      where: { id: id },
    })

    console.log('문서 삭제 성공');
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('문서 삭제 오류:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
