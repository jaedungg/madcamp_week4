// app/api/documents/recent/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const userId = searchParams.get('user_id') // 사용자 ID는 필수
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'user_id is required' 
      }, { status: 400 })
    }

    // 각 문서별로 가장 최근 접근 기록만 가져오기
    const recentAccessLogs = await prisma.$queryRaw`
      SELECT DISTINCT ON (dal.document_id) 
        dal.*,
        d.id as doc_id,
        d.title,
        d.content,
        d.excerpt,
        d.word_count,
        d.category,
        d.tags,
        d.status,
        d.is_favorite,
        d.ai_requests_used,
        d.created_at,
        d.updated_at,
        d.last_modified_at
      FROM document_access_logs dal
      JOIN documents d ON dal.document_id = d.id
      WHERE dal.user_id = ${userId}::uuid
      ORDER BY dal.document_id, dal.accessed_at DESC
    ` as any[];

    // 가장 최근에 접근한 순서로 정렬 후 limit 적용
    const sortedAndLimited = recentAccessLogs
      .sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime())
      .slice(0, limit);

    // RecentDocument 형식으로 변환
    const recentDocuments = sortedAndLimited.map((log) => ({
      // Document 기본 정보
      id: log.doc_id,
      title: log.title,
      content: log.content || '',
      excerpt: log.excerpt || '',
      wordCount: log.word_count || 0,
      category: log.category,
      tags: log.tags,
      isFavorite: log.is_favorite || false,
      createdAt: log.created_at,
      updatedAt: log.updated_at,
      lastModifiedAt: log.last_modified_at,
      status: log.status || 'draft',
      aiRequestsUsed: log.ai_requests_used || 0,
      
      // RecentDocument 추가 정보
      lastAccessedAt: log.accessed_at,
      timeSpent: log.time_spent || 0, // 분 단위
    }))

    return NextResponse.json({
      success: true,
      documents: recentDocuments,
    })
  } catch (error) {
    console.error('Error fetching recent documents:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 })
  }
}