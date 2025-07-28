// app/api/documents/[id]/favorite/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST 메서드: 즐겨찾기 토글 (프론트엔드에서 사용)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, { status: 401 }
      )
    }

    // 이메일을 통해 사용자 UUID 찾기
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, { status: 404 }
      )
    }

    // 사용자 소유 문서인지 확인
    const document = await prisma.documents.findFirst({
      where: { 
        id: params.id,
        user_id: user.id // UUID로 검색
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' }, { status: 404 }
      )
    }

    // 즐겨찾기 상태 토글
    const updatedDocument = await prisma.documents.update({
      where: { id: params.id },
      data: {
        is_favorite: !document.is_favorite,
        updated_at: new Date(),
        last_modified_at: new Date(),
      }
    })

    return NextResponse.json({ success: true, document: updatedDocument }, { status: 200 })
  } catch (error) {
    console.error('Error toggling favorite: ', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT 메서드: 즐겨찾기 설정 (특정 값으로 설정)
export async function PUT (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 사용자 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' }, { status: 401 }
      )
    }

    // 이메일을 통해 사용자 UUID 찾기
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, { status: 404 }
      )
    }

    const body = await req.json()
    const { is_favorite } = body
    if ( is_favorite == undefined ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' }, { status: 400 }
      )
    }

    // 사용자 소유 문서인지 확인
    const document = await prisma.documents.findFirst({
      where: { 
        id: params.id,
        user_id: user.id // UUID로 검색
      },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' }, { status: 404 }
      )
    }

    const updatedDocument = await prisma.documents.update({
      where: { id: params.id },
      data: {
        is_favorite,
        updated_at: new Date(),
        last_modified_at: new Date(),
      }
    })

    return NextResponse.json({ success: true, document: updatedDocument }, { status: 200 })
  } catch (error) {
    console.error('Error updating favorite: ', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}