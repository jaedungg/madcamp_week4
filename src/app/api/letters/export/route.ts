import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { generateExportFile } from '@/lib/exporters';
import { Document } from '@/lib/types/export';
import { LetterDesign } from '@/types/letter';

interface LetterExportRequest {
  format: 'letter';
  letterOptions: {
    design: LetterDesign;
    recipient?: string;
    sender?: string;
    date?: string;
  };
  content: string;
  title: string;
  userId: string;
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

    // 요청 데이터 파싱
    const requestData: LetterExportRequest = await request.json();
    
    // 데이터 유효성 검사
    if (!requestData.format || requestData.format !== 'letter') {
      return NextResponse.json(
        { success: false, error: '올바르지 않은 내보내기 형식입니다.' },
        { status: 400 }
      );
    }

    if (!requestData.letterOptions?.design) {
      return NextResponse.json(
        { success: false, error: '편지 디자인을 선택해주세요.' },
        { status: 400 }
      );
    }

    if (!requestData.content && (!requestData.title || requestData.title === '제목 없는 문서')) {
      return NextResponse.json(
        { success: false, error: '내보낼 내용이 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 확인
    if (requestData.userId !== session.user.email) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 가상의 문서 객체 생성 (현재 에디터 내용 기반)
    const document: Document = {
      id: 'current-document',
      userId: session.user.email,
      title: requestData.title || '제목 없는 문서',
      content: requestData.content || '',
      excerpt: null,
      word_count: requestData.content ? requestData.content.length : 0,
      category: 'letter',
      tags: [],
      status: 'draft',
      is_favorite: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    // 편지 생성 옵션 구성
    const exportOptions = {
      userId: session.user.email,
      format: 'letter' as const,
      includeMetadata: false,
      letterOptions: {
        design: requestData.letterOptions.design,
        recipient: requestData.letterOptions.recipient,
        sender: requestData.letterOptions.sender,
        date: requestData.letterOptions.date
      }
    };

    // 편지 PDF 파일 생성
    const result = await generateExportFile([document], exportOptions);
    
    // 파일명 생성
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0].replace(/-/g, '');
    const designName = {
      formal: '정식편지',
      business: '비즈니스편지',
      personal: '개인편지',
      thankyou: '감사편지',
      invitation: '초대편지'
    }[requestData.letterOptions.design];
    
    const filename = `${designName}_${timestamp}.pdf`;

    // 성공 응답
    return NextResponse.json({
      success: true,
      downloadUrl: result.downloadUrl,
      metadata: {
        filename,
        fileSize: result.fileSize,
        timestamp: now.toISOString(),
        design: requestData.letterOptions.design
      }
    });

  } catch (error) {
    console.error('편지 내보내기 API 오류:', error);
    
    // 오류 메시지 정제
    let errorMessage = '편지 내보내기 중 오류가 발생했습니다.';
    
    if (error instanceof Error) {
      if (error.message.includes('puppeteer')) {
        errorMessage = 'PDF 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('letterOptions')) {
        errorMessage = '편지 옵션이 올바르지 않습니다.';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}