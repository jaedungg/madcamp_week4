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

    // document_access_logs에서 최근 접근 기록과 함께 documents 정보 조회
    const recentAccessLogs = await prisma.document_access_logs.findMany({
      where: {
        user_id: userId,
      },
      include: {
        documents: true, // documents 테이블 조인
      },
      orderBy: {
        accessed_at: 'desc', // 최근 접근 순으로 정렬
      },
      take: limit,
    })

    // RecentDocument 형식으로 변환
    type RecentAccessLog = {
      accessed_at: Date;
      time_spent?: number;
      documents: {
        id: string;
        title: string;
        content?: string;
        excerpt?: string;
        word_count?: number;
        category?: string;
        tags?: string[];
        is_favorite?: boolean;
        created_at: Date;
        updated_at: Date;
        last_modified_at?: Date;
        status?: string;
        ai_requests_used?: number;
      };
    };

    const recentDocuments = recentAccessLogs.map((log) => ({
      // Document 기본 정보
      id: log.documents.id,
      title: log.documents.title,
      content: log.documents.content || '',
      excerpt: log.documents.excerpt || '',
      wordCount: log.documents.word_count || 0,
      category: log.documents.category,
      tags: log.documents.tags,
      isFavorite: log.documents.is_favorite || false,
      createdAt: log.documents.created_at,
      updatedAt: log.documents.updated_at,
      lastModifiedAt: log.documents.last_modified_at,
      status: log.documents.status || 'draft',
      aiRequestsUsed: log.documents.ai_requests_used || 0,
      
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