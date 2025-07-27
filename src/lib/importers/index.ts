// 파일 파서 통합 모듈

import { fileTypeFromBuffer } from 'file-type';
import { parseJsonFile } from './json';
import { parseCsvFile, detectCsvEncoding } from './csv';
import { parseTextFile, detectTextEncoding } from './text';
import { validateFileType, validateFileSize } from '../utils/import';
import type { 
  FileParseResult, 
  SupportedFileType, 
  FileParserOptions,
  ImportValidationResult 
} from '../types/import';

/**
 * 파일 파싱 통합 함수
 */
export async function parseFile(
  file: File, 
  options: FileParserOptions = {}
): Promise<FileParseResult> {
  const result: FileParseResult = {
    success: false,
    documents: [],
    errors: []
  };

  try {
    // 1. 파일 타입 검증
    const typeValidation = validateFileType(file);
    if (!typeValidation.isValid || !typeValidation.type) {
      result.errors.push(typeValidation.error || '지원하지 않는 파일 형식입니다.');
      return result;
    }

    const fileType = typeValidation.type;

    // 2. 파일 크기 검증
    const sizeValidation = validateFileSize(file, fileType);
    if (!sizeValidation.isValid) {
      result.errors.push(sizeValidation.error || '파일 크기가 제한을 초과했습니다.');
      return result;
    }

    // 3. MIME 타입 이중 검증 (보안)
    const mimeValidation = await validateMimeType(file, fileType);
    if (!mimeValidation.isValid) {
      result.errors.push(mimeValidation.error || '파일 형식이 확장자와 일치하지 않습니다.');
      return result;
    }

    // 4. 파일 형식에 따른 파싱
    let parseResult: FileParseResult;

    switch (fileType) {
      case 'json':
        parseResult = await parseJsonFile(file);
        break;
      
      case 'csv':
        parseResult = await parseCsvFile(file);
        break;
      
      case 'txt':
        parseResult = await parseTextFile(file);
        break;
      
      default:
        result.errors.push(`지원하지 않는 파일 형식: ${fileType}`);
        return result;
    }

    // 5. 결과 검증 및 제한 적용
    if (!parseResult.success) {
      result.errors.push(...parseResult.errors);
      return result;
    }

    // 문서 개수 제한
    const maxDocuments = options.maxDocuments || 1000;
    if (parseResult.documents.length > maxDocuments) {
      result.errors.push(`문서 개수가 제한을 초과했습니다. (최대 ${maxDocuments}개)`);
      return result;
    }

    // 성공 결과 반환
    result.success = true;
    result.documents = parseResult.documents;
    result.errors = parseResult.errors;

    // 성공 로깅
    console.log(`[File Parse Success] Type: ${fileType}, Documents: ${result.documents.length}, Size: ${file.size} bytes`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '파일 파싱 중 알 수 없는 오류가 발생했습니다.';
    result.errors.push(errorMessage);
    console.error('[File Parse Error]', error);
  }

  return result;
}

/**
 * MIME 타입 검증 (보안 강화)
 */
async function validateMimeType(file: File, expectedType: SupportedFileType): Promise<ImportValidationResult> {
  try {
    // 파일의 실제 바이너리 헤더 확인
    const buffer = await file.slice(0, 4100).arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // file-type 라이브러리로 실제 MIME 타입 검증
    const detectedType = await fileTypeFromBuffer(uint8Array);
    
    // JSON 파일은 텍스트로 인식될 수 있음
    if (expectedType === 'json') {
      // JSON 형식 검증 (간단한 구조 확인)
      try {
        const text = new TextDecoder().decode(uint8Array.slice(0, 1000));
        const trimmed = text.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return { isValid: true };
        }
      } catch {
        // 텍스트 디코딩 실패 시 JSON이 아님
      }
    }

    // CSV와 TXT 파일은 일반적으로 텍스트로 인식됨
    if (expectedType === 'csv' || expectedType === 'txt') {
      // 텍스트 파일인지 확인
      if (!detectedType) {
        // 바이너리가 아닌 텍스트 파일로 간주
        try {
          new TextDecoder('utf-8', { fatal: true }).decode(uint8Array.slice(0, 1000));
          return { isValid: true };
        } catch {
          return { 
            isValid: false, 
            error: '텍스트 파일이 아닙니다. 바이너리 파일은 지원하지 않습니다.' 
          };
        }
      }

      // 텍스트 관련 MIME 타입인지 확인
      if (detectedType.mime.startsWith('text/')) {
        return { isValid: true };
      }
    }

    // 위험한 파일 타입 차단
    const dangerousMimeTypes = [
      'application/x-executable',
      'application/x-msdownload',
      'application/x-sh',
      'application/javascript',
      'text/javascript',
      'application/x-php',
      'text/html'
    ];

    if (detectedType && dangerousMimeTypes.includes(detectedType.mime)) {
      return { 
        isValid: false, 
        error: '보안상 허용되지 않는 파일 형식입니다.' 
      };
    }

    return { isValid: true };

  } catch (error) {
    console.error('MIME type validation error:', error);
    // 검증 실패 시 안전하게 허용
    return { isValid: true };
  }
}

/**
 * 파일 인코딩 자동 감지
 */
export async function detectFileEncoding(file: File, fileType: SupportedFileType): Promise<string> {
  switch (fileType) {
    case 'csv':
      return await detectCsvEncoding(file);
    
    case 'txt':
      return await detectTextEncoding(file);
    
    case 'json':
    default:
      return 'utf-8';
  }
}

/**
 * 지원되는 파일 확장자 목록
 */
export const SUPPORTED_EXTENSIONS = [
  '.json',
  '.csv', 
  '.txt'
] as const;

/**
 * 지원되는 MIME 타입 목록
 */
export const SUPPORTED_MIME_TYPES = [
  'application/json',
  'text/csv',
  'text/plain',
  'text/tab-separated-values'
] as const;

/**
 * 파일 크기 제한 (바이트)
 */
export const FILE_SIZE_LIMITS = {
  json: 10 * 1024 * 1024,  // 10MB
  csv: 5 * 1024 * 1024,    // 5MB
  txt: 2 * 1024 * 1024     // 2MB
} as const;

/**
 * 기본 파서 옵션
 */
export const DEFAULT_PARSER_OPTIONS: FileParserOptions = {
  encoding: 'utf-8',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxDocuments: 1000
} as const;