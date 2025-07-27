// src/app/api/documents/shared/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(req: NextRequest) {
  try {
    // 1. 사용자 인증 확인
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      )
    }

    // 사용자 ID 조회 (email을 통해)
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2. 쿼리 파라미터 추출 및 검증
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')

    if (!type || !['shared-by-me', 'shared-with-me'].includes(type)) {
      return NextResponse.json(
        {
          error: '잘못된 type 파라미터입니다. "shared-by-me" 또는 "shared-with-me"를 사용해주세요.'
        },
        { status: 400 }
      )
    }

    const userId = user.id
    let documents

    // 3. 타입별 쿼리 실행
    if (type === 'shared-by-me') {
      // 내가 공유한 문서들
      documents = await prisma.documents.findMany({
        where: {
          document_shares: {
            some: {
              owner_id: userId,
              is_active: true
            }
          }
        },
        include: {
          document_shares: {
            where: {
              owner_id: userId,
              is_active: true
            },
            select: {
              id: true,
              share_id: true,
              share_type: true,
              permissions: true,
              expires_at: true,
              created_at: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updated_at: 'desc'
        }
      })
    } else {
      // 나에게 공유된 문서들
      // 현재 스키마상 shared_with_user_id가 없으므로,
      // share_type이 'public'이거나 특정 조건을 만족하는 문서들을 반환
      documents = await prisma.documents.findMany({
        where: {
          user_id: {
            not: userId // 내가 작성한 문서가 아닌 것들
          },
          document_shares: {
            some: {
              is_active: true,
              OR: [
                { share_type: 'public' },
                // 향후 shared_with_user_id 필드가 추가되면 이 조건 활성화
                // { shared_with_user_id: userId }
              ]
            }
          }
        },
        include: {
          document_shares: {
            where: {
              is_active: true,
              OR: [
                { share_type: 'public' },
                // { shared_with_user_id: userId }
              ]
            },
            select: {
              id: true,
              share_id: true,
              share_type: true,
              permissions: true,
              expires_at: true,
              created_at: true
            }
          },
          users: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          updated_at: 'desc'
        }
      })
    }

    // 4. 응답 데이터 구조화
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      title: doc.title,
      excerpt: doc.excerpt,
      category: doc.category,
      tags: doc.tags,
      status: doc.status,
      is_favorite: doc.is_favorite,
      word_count: doc.word_count,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      author: {
        id: doc.users.id,
        name: doc.users.name,
        email: doc.users.email
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shares: doc.document_shares.map((share: any) => ({
        id: share.id,
        share_id: share.share_id,
        share_type: share.share_type,
        permissions: share.permissions,
        expires_at: share.expires_at,
        shared_at: share.created_at
      }))
    }))

    return NextResponse.json({
      success: true,
      type,
      documents: formattedDocuments,
      count: formattedDocuments.length
    })

  } catch (error) {
    console.error('Error fetching shared documents:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}