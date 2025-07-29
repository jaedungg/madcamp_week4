// api/documents/import/route.ts

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

    const skipDuplicatesParam = formData.get('skipDuplicates');
    const updateExistingParam = formData.get('updateExisting');
    const categoryParam = formData.get('category');
    const tagsParam = formData.get('tags');

    const options = {
      skipDuplicates: skipDuplicatesParam !== 'false',
      updateExisting: updateExistingParam === 'true',
      category: typeof categoryParam === 'string' ? categoryParam : undefined,
      tags: typeof tagsParam === 'string' ? tagsParam.split(',').map(t => t.trim()) : undefined
    };

    const parseResult = await parseFile(file, {
      maxDocuments: MAX_CONCURRENT_DOCUMENTS
    });

    if (!parseResult.success || parseResult.documents.length === 0) {
      return NextResponse.json(
        {
          success: false,
          imported: 0,
          skipped: 0,
          errors: parseResult.errors.length > 0 ? parseResult.errors : ['파일 파싱에 실패했거나 유효한 문서가 없습니다.'],
          documents: []
        },
        { status: 400 }
      );
    }

    const documentsToProcess = parseResult.documents.map(doc => ({
      ...doc,
      category: options.category || doc.category,
      tags: options.tags || doc.tags
    }));

    // 인증 제거에 따라 userId는 더미 값 사용
    const userId = 'anonymous';

    const importResult = await processBatchImport(
      documentsToProcess,
      userId,
      {
        skipDuplicates: options.skipDuplicates,
        updateExisting: options.updateExisting
      }
    );

    const processingTime = Date.now() - startTime;
    const errors: string[] = [
      ...parseResult.errors,
      ...importResult.failed.map(f => `"${f.document.title}": ${f.error}`)
    ];

    const response: ImportResponse = {
      success: importResult.successful.length > 0,
      imported: importResult.successful.length,
      skipped: importResult.skipped.length,
      errors,
      documents: importResult.successful
    };

    console.log(`[Import Success] User: ${userId}, File: ${file.name}, Imported: ${response.imported}, Skipped: ${response.skipped}, Time: ${processingTime}ms`);
    return NextResponse.json(response, { status: 200 });

  } catch (error: unknown) {
    const errorId = Math.random().toString(36).substring(7);
    console.error(`[Import Error ${errorId}]`, error);

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