// app/api/documents/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 문서 카테고리 타입 정의 (기존 사용 패턴 기반)
type DocumentCategory = 'business-email' | 'personal-letter' | 'thank-you' | 'apology-message' | 'casual-message'

// 문서 상태 타입 정의 (schema 기반)
type DocumentStatus = 'draft' | 'published' | 'archived'

// 주간 활동 데이터 타입
interface WeeklyActivity {
  date: string
  count: number
}

// AI 사용 통계 타입
interface AIUsageStats {
  totalRequests: number
  mostUsedFeature: string
  costEstimate: number
}

// 문서 통계 응답 타입
interface DocumentStats {
  totalDocuments: number
  totalWords: number
  avgWordsPerDocument: number
  documentsByCategory: Record<DocumentCategory, number>
  documentsByStatus: Record<DocumentStatus, number>
  weeklyActivity: WeeklyActivity[]
  aiUsageStats: AIUsageStats
}

// API 응답 타입
interface StatsResponse {
  success: boolean
  stats: DocumentStats
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    // 기본 WHERE 조건 설정
    const where: {
      user_id?: string
    } = {}
    if (userId) {
      where.user_id = userId
    }

    // 1. 기본 통계 조회 (총 문서 수, 총 단어 수)
    const basicStats = await prisma.documents.aggregate({
      where,
      _count: {
        _all: true
      },
      _sum: {
        word_count: true
      }
    })

    // 2. 카테고리별 문서 수 조회
    const categoryStats = await prisma.documents.groupBy({
      by: ['category'],
      where,
      _count: {
        _all: true
      }
    })

    // 3. 상태별 문서 수 조회
    const statusStats = await prisma.documents.groupBy({
      by: ['status'],
      where,
      _count: {
        _all: true
      }
    })

    // 4. 주간 활동 조회 (최근 7일)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let weeklyActivityRaw: Array<{date: Date, count: bigint}>
    
    if (userId) {
      weeklyActivityRaw = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*)::bigint as count
        FROM documents 
        WHERE created_at >= ${sevenDaysAgo} AND user_id = ${userId}::uuid
        GROUP BY DATE(created_at)
        ORDER BY date
      `
    } else {
      weeklyActivityRaw = await prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*)::bigint as count
        FROM documents 
        WHERE created_at >= ${sevenDaysAgo}
        GROUP BY DATE(created_at)
        ORDER BY date
      `
    }

    // 5. AI 사용 통계 조회
    const aiUsageRaw = await prisma.documents.aggregate({
      where,
      _sum: {
        ai_requests_used: true
      }
    })

    // 데이터 가공 및 응답 구성
    const totalDocuments = basicStats._count._all || 0
    const totalWords = basicStats._sum.word_count || 0
    const avgWordsPerDocument = totalDocuments > 0 ? Math.round(totalWords / totalDocuments * 10) / 10 : 0

    // 카테고리별 데이터 포맷팅
    const documentsByCategory: Record<DocumentCategory, number> = {
      'business-email': 0,
      'personal-letter': 0,
      'thank-you': 0,
      'apology-message': 0,
      'casual-message': 0
    }

    categoryStats.forEach((stat: { category: string; _count: { _all: number } }) => {
      const category = stat.category as DocumentCategory
      if (category in documentsByCategory) {
        documentsByCategory[category] = stat._count._all
      }
    })

    // 상태별 데이터 포맷팅
    const documentsByStatus: Record<DocumentStatus, number> = {
      'draft': 0,
      'published': 0,
      'archived': 0
    }

    statusStats.forEach((stat: { status: string; _count: { _all: number } }) => {
      const status = (stat.status || 'draft') as DocumentStatus
      if (status in documentsByStatus) {
        documentsByStatus[status] = stat._count._all
      }
    })

    // 주간 활동 데이터 포맷팅 (누락된 날짜를 0으로 채우기)
    const weeklyActivity: WeeklyActivity[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateString = date.toISOString().split('T')[0]

      const found = weeklyActivityRaw.find(item => 
        item.date.toISOString().split('T')[0] === dateString
      )

      weeklyActivity.push({
        date: dateString,
        count: found ? Number(found.count) : 0
      })
    }

    // AI 사용 통계 계산
    const totalRequests = aiUsageRaw._sum.ai_requests_used || 0
    
    // 가장 많이 사용된 기능 추정 (실제 데이터가 없으므로 기본값 설정)
    // 실제 구현에서는 별도 테이블에서 AI 액션 로그를 추적해야 함
    const mostUsedFeature = totalRequests > 0 ? 'generate' : 'none'
    
    // 비용 추정 (토큰당 약 0.01원으로 가정)
    const costEstimate = Math.round(totalRequests * 0.01 * 100) / 100

    const aiUsageStats: AIUsageStats = {
      totalRequests,
      mostUsedFeature,
      costEstimate
    }

    const response: StatsResponse = {
      success: true,
      stats: {
        totalDocuments,
        totalWords,
        avgWordsPerDocument,
        documentsByCategory,
        documentsByStatus,
        weeklyActivity,
        aiUsageStats
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching document stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '문서 통계를 가져오는데 실패했습니다.' 
      }, 
      { status: 500 }
    )
  }
}