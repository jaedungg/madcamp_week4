// 문서 내보내기 핵심 로직

import { promises as fs } from 'fs';
import path from 'path';
import type { Document, ExportOptions } from '../types/export';

/**
 * 메인 파일 생성 함수
 */
export async function generateExportFile(
  documents: Document[],
  options: ExportOptions
): Promise<{ filePath: string; downloadUrl: string; fileSize: number }> {
  const timestamp = Date.now();
  const filename = `${options.userId}_${timestamp}_documents.${options.format}`;
  const exportsDir = path.join(process.cwd(), 'public/exports/temp');
  const filePath = path.join(exportsDir, filename);

  // exports 디렉터리가 없으면 생성
  await fs.mkdir(exportsDir, { recursive: true });

  let fileSize = 0;

  switch (options.format) {
    case 'json':
      fileSize = await generateJSONFile(documents, filePath, options);
      break;
    case 'csv':
      fileSize = await generateCSVFile(documents, filePath, options);
      break;
    case 'pdf':
      fileSize = await generatePDFFile(documents, filePath, options);
      break;
    default:
      throw new Error(`지원하지 않는 형식: ${options.format}`);
  }

  return {
    filePath,
    downloadUrl: `/exports/temp/${filename}`,
    fileSize
  };
}

/**
 * JSON 파일 생성
 */
async function generateJSONFile(
  documents: Document[],
  filePath: string,
  options: ExportOptions
): Promise<number> {
  const exportData = {
    metadata: {
      exportedAt: new Date().toISOString(),
      format: 'json',
      userId: options.userId,
      totalDocuments: documents.length,
      includeMetadata: options.includeMetadata
    },
    documents: documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      ...(options.includeMetadata && {
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        type: doc.type,
        tags: doc.tags
      })
    }))
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  await fs.writeFile(filePath, jsonString, 'utf-8');

  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * CSV 파일 생성
 */
async function generateCSVFile(
  documents: Document[],
  filePath: string,
  options: ExportOptions
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;

  const headers = [
    { id: 'id', title: 'ID' },
    { id: 'title', title: '제목' },
    { id: 'content', title: '내용' }
  ];

  if (options.includeMetadata) {
    headers.push(
      { id: 'type', title: '유형' },
      { id: 'tags', title: '태그' },
      { id: 'createdAt', title: '생성일' },
      { id: 'updatedAt', title: '수정일' }
    );
  }

  const csvWriter = createCsvWriter({
    path: filePath,
    header: headers,
    encoding: 'utf8'
  });

  const csvData = documents.map(doc => ({
    id: doc.id,
    title: doc.title,
    content: doc.content.replace(/\n/g, ' '), // 줄바꿈 제거
    ...(options.includeMetadata && {
      type: doc.type || '',
      tags: doc.tags?.join(', ') || '',
      createdAt: doc.createdAt.toLocaleDateString('ko-KR'),
      updatedAt: doc.updatedAt.toLocaleDateString('ko-KR')
    })
  }));

  await csvWriter.writeRecords(csvData);

  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * PDF 파일 생성
 */
async function generatePDFFile(
  documents: Document[],
  filePath: string,
  options: ExportOptions
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const puppeteer = require('puppeteer');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // HTML 템플릿 생성
    const htmlContent = generatePDFHTML(documents, options);
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      },
      printBackground: true
    });

    const stats = await fs.stat(filePath);
    return stats.size;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * PDF용 HTML 템플릿 생성
 */
function generatePDFHTML(documents: Document[], options: ExportOptions): string {
  const now = new Date();

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>문서 내보내기</title>
      <style>
        body { 
          font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e1e5e9;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2d3748;
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .header .meta {
          color: #666;
          font-size: 14px;
        }
        .document {
          margin-bottom: 40px;
          page-break-inside: avoid;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 20px;
          background: #f8f9fa;
        }
        .document-title {
          font-size: 20px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 15px;
          border-bottom: 1px solid #cbd5e0;
          padding-bottom: 8px;
        }
        .document-content {
          margin-bottom: 15px;
          line-height: 1.8;
          font-size: 14px;
        }
        .document-meta {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e1e5e9;
          padding-top: 10px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
        }
        .meta-item {
          margin-right: 20px;
        }
        .tag {
          background: #edf2f7;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          margin-right: 5px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #e1e5e9;
          padding-top: 20px;
        }
        @media print {
          .document {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>문서 내보내기</h1>
        <div class="meta">
          내보낸 날짜: ${now.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })} | 총 ${documents.length}개 문서
        </div>
      </div>
      
      ${documents.map((doc, index) => `
        <div class="document">
          <div class="document-title">${index + 1}. ${doc.title || '제목 없음'}</div>
          <div class="document-content">${doc.content.replace(/\n/g, '<br>')}</div>
          ${options.includeMetadata ? `
            <div class="document-meta">
              <div>
                <span class="meta-item">
                  <strong>유형:</strong> ${doc.type || '미분류'}
                </span>
                <span class="meta-item">
                  <strong>생성일:</strong> ${new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                </span>
                <span class="meta-item">
                  <strong>수정일:</strong> ${new Date(doc.updatedAt).toLocaleDateString('ko-KR')}
                </span>
              </div>
              ${doc.tags && doc.tags.length > 0 ? `
                <div>
                  <strong>태그:</strong> 
                  ${doc.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <div class="footer">
        프롬(From) AI 작문 도우미 - 문서 내보내기
      </div>
    </body>
    </html>
  `;
}