import { NextRequest, NextResponse } from 'next/server';
import { parseFile } from '@/lib/importers';
import {
  processBatchImport,
  isImportRateLimited
} from '@/lib/utils/import';
import { authenticateUser } from '@/lib/utils/export';
import type { ImportResponse } from '@/lib/types/import';

// 요청 크기 제한 (바이트)
const MAX_REQUEST_SIZE = 20 * 1024 * 1024; // 20MB

// 동시 처리 문서 수 제한
const MAX_CONCURRENT_DOCUMENTS = 500;

export async function POST(request: NextRequest): Promise<NextResponse<ImportResponse>> {
  const startTime = Date.now();

  try {
    // Rate limiting 체크
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    if (await isImportRateLimited(clientIP)) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'],
          documents: []
        },
        { status: 429 }
      );
    }

    // 요청 크기 제한 체크
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['요청 크기가 너무 큽니다. 최대 20MB까지 지원됩니다.'],
          documents: []
        },
        { status: 413 }
      );
    }

    // 사용자 인증
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['인증이 필요합니다. Authorization 헤더를 확인해주세요.'],
          documents: []
        },
        { status: 401 }
      );
    }

    // FormData 파싱
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['FormData 파싱에 실패했습니다. 올바른 형식으로 파일을 업로드해주세요.'],
          documents: []
        },
        { status: 400 }
      );
    }

    // 파일 추출
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['파일이 없습니다. "file" 필드에 파일을 업로드해주세요.'],
          documents: []
        },
        { status: 400 }
      );
    }

    // 옵션 추출
    const skipDuplicatesParam = formData.get('skipDuplicates');
    const updateExistingParam = formData.get('updateExisting');
    const categoryParam = formData.get('category');
    const tagsParam = formData.get('tags');

    const options = {
      skipDuplicates: skipDuplicatesParam !== 'false', // 기본값: true
      updateExisting: updateExistingParam === 'true',  // 기본값: false
      category: typeof categoryParam === 'string' ? categoryParam : undefined,
      tags: typeof tagsParam === 'string' ? tagsParam.split(',').map(t => t.trim()) : undefined
    };

    // 파일 파싱
    const parseResult = await parseFile(file, {
      maxDocuments: MAX_CONCURRENT_DOCUMENTS
    });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: parseResult.errors.length > 0 ? parseResult.errors : ['파일 파싱에 실패했습니다.'],
          documents: []
        },
        { status: 400 }
      );
    }

    if (parseResult.documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: ['파일에서 유효한 문서를 찾을 수 없습니다.'],
          documents: []
        },
        { status: 400 }
      );
    }

    // 옵션 적용 (카테고리, 태그 덮어쓰기)
    const documentsToProcess = parseResult.documents.map(doc => ({
      ...doc,
      category: options.category || doc.category,
      tags: options.tags || doc.tags
    }));

    // 배치 가져오기 처리
    const importResult = await processBatchImport(
      documentsToProcess,
      authResult.userId,
      {
        skipDuplicates: options.skipDuplicates,
        updateExisting: options.updateExisting
      }
    );

    const processingTime = Date.now() - startTime;

    // 에러 메시지 수집
    const errors: string[] = [
      ...parseResult.errors,
      ...importResult.failed.map(f => `"${f.document.title}": ${f.error}`),
    ];

    // 성공 로깅
    console.log(`[Import Success] User: ${authResult.userId}, File: ${file.name}, Total: ${importResult.totalProcessed}, Imported: ${importResult.successful.length}, Skipped: ${importResult.skipped.length}, Failed: ${importResult.failed.length}, Time: ${processingTime}ms`);

    // 응답 생성
    const response: ImportResponse = {
      success: importResult.successful.length > 0,
      imported: importResult.successful.length,
      skipped: importResult.skipped.length,
      errors,
      documents: importResult.successful
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    const processingTime = Date.now() - startTime;
    const errorId = Math.random().toString(36).substring(7);

    // 에러 로깅
    console.error(`[Import Error ${errorId}] Time: ${processingTime}ms`, error);

    // 사용자에게는 일반적인 에러 메시지
    return NextResponse.json(
      {
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['파일 가져오기 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'],
        documents: []
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message: '프롬 문서 가져오기 API',
      version: '1.0.0',
      methods: ['POST'],
      description: 'JSON, CSV, TXT 파일에서 문서를 가져옵니다.',
      supportedFormats: ['json', 'csv', 'txt'],
      maxFileSize: '20MB',
      maxDocuments: 500,
      usage: {
        endpoint: 'POST /api/documents/import',
        headers: {
          'Authorization': 'Bearer <token>'
        },
        body: {
          description: 'FormData 형식',
          fields: {
            file: 'File (필수) - JSON, CSV, TXT 파일',
            skipDuplicates: 'boolean (선택사항, 기본값: true) - 중복 문서 건너뛰기',
            updateExisting: 'boolean (선택사항, 기본값: false) - 기존 문서 업데이트',
            category: 'string (선택사항) - 모든 문서에 적용할 카테고리',
            tags: 'string (선택사항) - 쉼표로 구분된 태그 목록'
          }
        },
        response: {
          success: 'boolean',
          imported: 'number - 성공적으로 가져온 문서 수',
          skipped: 'number - 건너뛴 문서 수 (중복 등)',
          errors: 'string[] - 오류 메시지 목록',
          documents: 'Document[] - 가져온 문서 목록'
        }
      },
      fileFormats: {
        json: {
          description: '단일 문서 또는 문서 배열',
          examples: [
            '{ "title": "제목", "content": "내용", "category": "카테고리", "tags": ["태그1", "태그2"] }',
            '[{ "title": "제목1", "content": "내용1" }, { "title": "제목2", "content": "내용2" }]',
            '{ "documents": [{ "title": "제목", "content": "내용" }] }'
          ]
        },
        csv: {
          description: 'CSV 형식 (첫 행은 헤더)',
          requiredColumns: ['title (제목)', 'content (내용)'],
          optionalColumns: ['category (카테고리)', 'tags (태그, 쉼표 구분)'],
          example: 'title,content,category,tags\n"문서 제목","문서 내용","카테고리","태그1,태그2"'
        },
        txt: {
          description: '텍스트 파일 (단일 또는 구분자로 분리된 다중 문서)',
          separators: ['---', '===', '###', '***'],
          titleExtraction: '첫 줄이 짧으면 제목으로 처리, 또는 # 제목, 제목: 내용 패턴'
        }
      },
      limits: {
        fileSize: {
          json: '10MB',
          csv: '5MB',
          txt: '2MB'
        },
        documents: '500개/파일',
        requests: '5회/분',
        contentLength: '50,000자/문서'
      }
    },
    { status: 200 }
  );
}