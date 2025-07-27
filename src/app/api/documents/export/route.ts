import { NextRequest, NextResponse } from 'next/server';
import { generateExportFile } from '@/lib/exporters';
import {
  getDocumentsForUser,
  validateExportRequest,
  authenticateUser,
  isRateLimited,
  estimateFileSize
} from '@/lib/utils/export';
import type { ExportRequest, ExportResponse } from '@/lib/types/export';

// 파일 크기 제한 (바이트)
const MAX_FILE_SIZE = {
  json: 10 * 1024 * 1024,  // 10MB
  csv: 5 * 1024 * 1024,    // 5MB
  pdf: 20 * 1024 * 1024    // 20MB
};

export async function POST(request: NextRequest): Promise<NextResponse<ExportResponse>> {
  const startTime = Date.now();

  try {
    // Rate limiting 체크
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (await isRateLimited(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
        },
        { status: 429 }
      );
    }

    // 요청 크기 제한
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 100) { // 100KB 제한
      return NextResponse.json(
        {
          success: false,
          error: '요청 크기가 너무 큽니다.'
        },
        { status: 413 }
      );
    }

    // 요청 본문 파싱
    const body: ExportRequest = await request.json();

    // 입력 검증
    const validationResult = validateExportRequest(body);
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error
        },
        { status: 400 }
      );
    }

    const { format, documentIds, includeContent = true } = body;

    // 사용자 인증
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다. Authorization 헤더를 확인해주세요.'
        },
        { status: 401 }
      );
    }

    // 문서 조회
    const documents = await getDocumentsForUser(
      authResult.userId,
      documentIds,
      includeContent
    );

    if (documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: documentIds && documentIds.length > 0
            ? '요청한 문서를 찾을 수 없습니다.'
            : '내보낼 문서가 없습니다.'
        },
        { status: 404 }
      );
    }

    // 파일 크기 추정 및 제한 확인
    const estimatedSize = estimateFileSize(documents, format);
    const maxSize = MAX_FILE_SIZE[format];

    if (estimatedSize > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `파일 크기가 너무 큽니다. ${format.toUpperCase()} 형식의 최대 크기는 ${Math.round(maxSize / 1024 / 1024)}MB입니다. 문서 수를 줄여주세요.`
        },
        { status: 413 }
      );
    }

    // 파일 생성
    const exportResult = await generateExportFile(documents, {
      userId: authResult.userId,
      format,
      includeMetadata: true
    });

    const processingTime = Date.now() - startTime;

    // 성공 로깅
    console.log(`[Export Success] User: ${authResult.userId}, Format: ${format}, Documents: ${documents.length}, Size: ${exportResult.fileSize} bytes, Time: ${processingTime}ms`);

    // 성공 응답
    return NextResponse.json({
      success: true,
      downloadUrl: exportResult.downloadUrl,
      metadata: {
        count: documents.length,
        format,
        fileSize: exportResult.fileSize,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: unknown) {
    const format = 'unknown';
    // 에러 로깅
    const errorId = Math.random().toString(36).substring(7);
    const processingTime = Date.now() - startTime;

    console.error(`[Export Error ${errorId}] Time: ${processingTime}ms`, error);

    // 사용자에게는 일반적인 에러 메시지
    return NextResponse.json(
      {
        success: false,
        error: '파일 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        metadata: {
          count: 0,
          format,
          fileSize: 0,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: '프롬 문서 내보내기 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '사용자의 문서를 JSON, CSV, PDF 형식으로 내보냅니다.',
      supportedFormats: ['json', 'csv', 'pdf'],
      maxFileSizes: {
        json: '10MB',
        csv: '5MB',
        pdf: '20MB'
      },
      usage: {
        endpoint: 'POST /api/documents/export',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer <token>'
        },
        body: {
          format: 'json | csv | pdf',
          documentIds: 'string[] (선택사항, 없으면 모든 문서)',
          includeContent: 'boolean (선택사항, 기본값: true)'
        },
        response: {
          success: 'boolean',
          downloadUrl: 'string (성공시)',
          error: 'string (실패시)',
          metadata: {
            count: 'number',
            format: 'string',
            fileSize: 'number',
            timestamp: 'string'
          }
        }
      }
    },
    { status: 200 }
  );
}