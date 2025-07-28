// app/api/documents/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const raw = await req.text()
  console.log('🔥 Raw body:', raw)
  try {
    const body = JSON.parse(raw);
    const { title, content, category, tags, user_id } = body

    if (!title || !category || !user_id) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    // user_id가 이메일인지 UUID인지 확인하고 UUID로 변환
    let actualUserId = user_id
    const isEmail = user_id.includes('@')
    
    if (isEmail) {
      // 이메일인 경우 사용자를 찾아서 UUID를 가져옴
      const user = await prisma.users.findUnique({
        where: { email: user_id },
        select: { id: true }
      })
      
      if (user) {
        actualUserId = user.id
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
    }

    const excerpt = content ? content.slice(0, 200) : ''
    const wordCount = content ? content.trim().split(/\s+/).length : 0

    const document = await prisma.documents.create({
      data: {
        title,
        content,
        category,
        tags,
        user_id: actualUserId,
        excerpt,
        word_count: wordCount,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const category = searchParams.get('category') || 'all'
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true'
    const userId = searchParams.get('user_id') // 필수 아님

    const where: Prisma.documentsWhereInput = {}

    if (userId) {
      // user_id가 이메일인지 UUID인지 확인
      const isEmail = userId.includes('@')
      
      if (isEmail) {
        // 이메일인 경우 사용자를 찾아서 UUID를 가져옴
        const user = await prisma.users.findUnique({
          where: { email: userId },
          select: { id: true }
        })
        
        if (user) {
          where.user_id = user.id
        } else {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
      } else {
        // UUID인 경우 직접 사용
        where.user_id = userId
      }
    }
    if (category !== 'all') where.category = category
    if (status !== 'all') where.status = status
    if (favoritesOnly) where.is_favorite = true
    if (search) {
      // search_vector 대신 title과 content에서 검색
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ]
    }

    const total = await prisma.documents.count({ where })

    const documents = await prisma.documents.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    })

    const totalPages = Math.ceil(total / limit)

    // 문서 통계 (예: 전체, 카테고리별 수 등)
    const stats = await prisma.documents.groupBy({
      by: ['category'],
      _count: { _all: true },
      where,
    })

    return NextResponse.json({
      success: true,
      documents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      stats,
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/*
search_vector를 통한 Full Text Search는 PostgreSQL과 Prisma에서 직접 연결이 제한되므로,
Prisma raw query로 대체하거나
pg_trgm 확장과 함께 .contains, .startsWith 방식으로 우회하는 것도 고려해볼 수 있어요.

지금은 단순히 search_vector 필드를 search 문자열로 조회한다고 가정했어요.

DocumentStats는 category 기준으로 문서 수를 집계한 예시입니다. 원하시는 구조로 확장 가능합니다.
*/