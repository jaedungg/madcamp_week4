import { NextRequest, NextResponse } from 'next/server';
import { generateExportFile } from '@/lib/exporters';
import {
  getDocumentsForUser,
  validateExportRequest,
  isRateLimited,
  estimateFileSize
} from '@/lib/utils/export';
import type { ExportRequest, ExportResponse } from '@/lib/types/export';

const MAX_FILE_SIZE = {
  json: 10 * 1024 * 1024,
  csv: 5 * 1024 * 1024,
  pdf: 20 * 1024 * 1024
};

export async function POST(request: NextRequest): Promise<NextResponse<ExportResponse>> {
  const startTime = Date.now();

  try {
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

    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 1024 * 100) {
      return NextResponse.json(
        {
          success: false,
          error: '요청 크기가 너무 큽니다.'
        },
        { status: 413 }
      );
    }

    const body: ExportRequest & { userId: string } = await request.json();

    if (!body.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId는 필수입니다.'
        },
        { status: 400 }
      );
    }

    const { format, documentIds, includeContent = true, userId } = body;

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

    const documents = await getDocumentsForUser(userId, documentIds, includeContent);

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

    const exportResult = await generateExportFile(documents, {
      userId,
      format,
      includeMetadata: true
    });

    const processingTime = Date.now() - startTime;

    console.log(`[Export Success] User: ${userId}, Format: ${format}, Documents: ${documents.length}, Size: ${exportResult.fileSize} bytes, Time: ${processingTime}ms`);

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
    const errorId = Math.random().toString(36).substring(7);
    const processingTime = Date.now() - startTime;

    console.error(`[Export Error ${errorId}] Time: ${processingTime}ms`, error);

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
