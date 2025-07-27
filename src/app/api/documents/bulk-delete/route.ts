import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import pool from '@/lib/db';

interface BulkDeleteRequest {
  documentIds: string[];
}

export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const body: BulkDeleteRequest = await request.json();
    const { documentIds } = body;

    // 입력 검증
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '삭제할 문서 ID를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 문서 ID 개수 제한 (최대 100개)
    if (documentIds.length > 100) {
      return NextResponse.json(
        { success: false, error: '한 번에 최대 100개의 문서만 삭제할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 각 문서 ID 형식 검증 (UUID 형태)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (const id of documentIds) {
      if (typeof id !== 'string' || !uuidRegex.test(id)) {
        return NextResponse.json(
          { success: false, error: '잘못된 문서 ID 형식입니다.' },
          { status: 400 }
        );
      }
    }

    const client = await pool.connect();
    
    try {
      // 트랜잭션 시작
      await client.query('BEGIN');

      // 현재 사용자의 이메일로 사용자 ID 조회
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [session.user.email]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: '사용자를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      const userId = userResult.rows[0].id;

      // 사용자 소유의 문서인지 확인하고 삭제
      const deleteResult = await client.query(
        `DELETE FROM documents 
         WHERE id = ANY($1) AND user_id = $2 
         RETURNING id`,
        [documentIds, userId]
      );

      const deletedCount = deleteResult.rows.length;

      // 트랜잭션 커밋
      await client.query('COMMIT');

      // 성공 응답
      return NextResponse.json({
        success: true,
        deletedCount,
        message: `${deletedCount}개의 문서가 삭제되었습니다.`
      });

    } catch (dbError: unknown) {
      // 트랜잭션 롤백
      await client.query('ROLLBACK');
      
      console.error('문서 삭제 중 데이터베이스 오류:', dbError);
      
      return NextResponse.json(
        { success: false, error: '문서 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    } finally {
      client.release();
    }

  } catch (error: unknown) {
    console.error('Bulk delete API 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '프롬 문서 일괄 삭제 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '여러 문서를 한 번에 삭제합니다.'
    },
    { status: 200 }
  );
}