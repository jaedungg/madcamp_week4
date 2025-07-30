// 편지 템플릿 시스템 - 5가지 한국 편지 디자인

import { LetterDesign, LetterExportOptions } from '@/types/letter';

/**
 * 편지 PDF용 HTML 템플릿 생성
 */
export function generateLetterHTML(options: LetterExportOptions): string {
  const now = new Date();
  const formattedDate = options.date || `${now.getFullYear()}년 ${(now.getMonth() + 1).toString().padStart(2, '0')}월 ${now.getDate().toString().padStart(2, '0')}일`;

  switch (options.design) {
    case 'formal':
      return generateFormalLetterHTML(options, formattedDate);
    case 'business':
      return generateBusinessLetterHTML(options, formattedDate);
    case 'personal':
      return generatePersonalLetterHTML(options, formattedDate);
    case 'thankyou':
      return generateThankYouLetterHTML(options, formattedDate);
    case 'invitation':
      return generateInvitationLetterHTML(options, formattedDate);
    default:
      return generateFormalLetterHTML(options, formattedDate);
  }
}

/**
 * 정식 편지 템플릿
 */
function generateFormalLetterHTML(options: LetterExportOptions, date: string): string {
  const { content, title, recipient, sender } = options;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || '편지'}</title>
      <style>
        body { 
          font-family: 'Batang', '바탕', 'Times New Roman', serif;
          line-height: 2.0;
          color: #2d3748;
          margin: 0;
          padding: 40px 60px;
          background: white;
          font-size: 14px;
        }
        .header {
          text-align: right;
          margin-bottom: 60px;
          border-bottom: 2px solid #4a5568;
          padding-bottom: 20px;
        }
        .date {
          font-size: 16px;
          font-weight: bold;
          color: #2d3748;
        }
        .recipient {
          text-align: left;
          margin-bottom: 40px;
          font-size: 16px;
          font-weight: bold;
        }
        .title {
          text-align: center;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 50px;
          color: #1a202c;
          border-bottom: 1px solid #cbd5e0;
          padding-bottom: 15px;
        }
        .content {
          margin-bottom: 60px;
          text-align: justify;
          text-indent: 2em;
          line-height: 2.2;
        }
        .content p {
          margin-bottom: 1.5em;
          text-indent: 2em;
        }
        .sender {
          text-align: right;
          margin-top: 40px;
          font-size: 16px;
        }
        .sender-name {
          font-weight: bold;
          margin-top: 10px;
        }
        .footer {
          margin-top: 80px;
          text-align: center;
          font-size: 12px;
          color: #718096;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        .watermark {
          position: fixed;
          bottom: 30px;
          right: 30px;
          font-size: 10px;
          color: #cbd5e0;
          transform: rotate(-45deg);
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="date">${date}</div>
      </div>
      
      ${recipient ? `<div class="recipient">${recipient} 귀하</div>` : ''}
      
      ${title && title !== '제목 없는 문서' ? `<div class="title">${title}</div>` : ''}
      
      <div class="content">
        ${formatContentForLetter(content)}
      </div>
      
      <div class="sender">
        <div>경의를 표하며</div>
        ${sender ? `<div class="sender-name">${sender}</div>` : `<div class="sender-name">보내는 이</div>`}
      </div>
    
      
      <div class="watermark">FROM</div>
    </body>
    </html>
  `;
}

/**
 * 비즈니스 편지 템플릿
 */
function generateBusinessLetterHTML(options: LetterExportOptions, date: string): string {
  const { content, title, recipient, sender } = options;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || '업무 서신'}</title>
      <style>
        body { 
          font-family: 'Malgun Gothic', '맑은 고딕', Arial, sans-serif;
          line-height: 1.8;
          color: #2d3748;
          margin: 0;
          padding: 30px 50px;
          background: white;
          font-size: 13px;
        }
        .letterhead {
          border-bottom: 3px solid #3182ce;
          padding-bottom: 20px;
          margin-bottom: 40px;
          text-align: center;
        }
        .letterhead h1 {
          margin: 0;
          font-size: 24px;
          color: #3182ce;
          font-weight: bold;
        }
        .date-recipient {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          font-size: 14px;
        }
        .date {
          color: #4a5568;
        }
        .recipient {
          font-weight: bold;
          color: #2d3748;
        }
        .subject {
          background: #f7fafc;
          border-left: 4px solid #3182ce;
          padding: 15px 20px;
          margin-bottom: 30px;
          font-weight: bold;
          font-size: 15px;
        }
        .content {
          margin-bottom: 40px;
          line-height: 1.9;
        }
        .content p {
          margin-bottom: 1.2em;
        }
        .signature {
          border-top: 1px solid #e2e8f0;
          padding-top: 30px;
          text-align: right;
        }
        .signature-line {
          margin-bottom: 5px;
        }
        .company-info {
          font-size: 11px;
          color: #718096;
          text-align: center;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
      </style>
    </head>
    <body>
      <div class="letterhead">
        <h1>업무 서신</h1>
      </div>
      
      <div class="date-recipient">
        <div class="date">${date}</div>
        ${recipient ? `<div class="recipient">${recipient}</div>` : ''}
      </div>
      
      ${title && title !== '제목 없는 문서' ? `<div class="subject">제목: ${title}</div>` : ''}
      
      <div class="content">
        ${formatContentForLetter(content)}
      </div>
      
      <div class="signature">
        <div class="signature-line">감사합니다.</div>
        <div class="signature-line">${sender || '담당자'}</div>
      </div>
    
    </body>
    </html>
  `;
}

/**
 * 개인 편지 템플릿
 */
function generatePersonalLetterHTML(options: LetterExportOptions, date: string): string {
  const { content, title, recipient, sender } = options;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || '개인 편지'}</title>
      <style>
        body { 
          font-family: 'Gothic', '고딕', 'Malgun Gothic', sans-serif;
          line-height: 1.9;
          color: #4a5568;
          margin: 0;
          padding: 40px 50px;
          background: linear-gradient(135deg, #fef9e7 0%, #ffffff 100%);
          font-size: 14px;
        }
        .paper {
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          padding: 40px;
          margin: 0 auto;
          max-width: 700px;
          position: relative;
        }
        .date {
          text-align: right;
          padding: 10px 0;
          margin-bottom: 30px;
          font-size: 13px;
          color: #718096;
          font-style: italic;
        }
        .recipient {
          margin-bottom: 30px;
          font-size: 16px;
          color: #2d3748;
        }
        .greeting {
          margin-bottom: 25px;
          font-size: 15px;
          color: #4a5568;
        }
        .content {
          margin-bottom: 40px;
          line-height: 2.0;
          text-align: justify;
        }
        .content p {
          margin-bottom: 1.5em;
          text-indent: 1em;
        }
        .closing {
          text-align: right;
          margin-top: 40px;
        }
        .closing-phrase {
          margin-bottom: 15px;
          font-style: italic;
          color: #718096;
        }
        .sender-name {
          font-weight: bold;
          color: #2d3748;
          font-size: 16px;
        }
        .decorative-line {
          border-bottom: 2px dotted #e2e8f0;
          margin: 30px 0;
        }
        .heart {
          position: absolute;
          top: 20px;
          right: 30px;
          color: #f56565;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="paper">
        <div class="heart">♡</div>
        
        <div class="date">${date}</div>
        
        ${title ? `<div class="recipient">${title}</div>` : ''}
        
        
        <div class="content">
          ${formatContentForLetter(content)}
        </div>
        
        <div class="decorative-line"></div>
        
        <div class="closing">
          <div class="sender-name">${sender || '당신의 친구'} 드림</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 감사 편지 템플릿
 */
function generateThankYouLetterHTML(options: LetterExportOptions, date: string): string {
  const { content, title, recipient, sender } = options;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || '감사 편지'}</title>
      <style>
        body { 
          font-family: 'Batang', '바탕', serif;
          line-height: 2.0;
          color: #2d3748;
          margin: 0;
          padding: 50px;
          background: linear-gradient(45deg, #f0fff4 0%, #ffffff 50%, #fef5e7 100%);
          font-size: 14px;
        }
        .letter-container {
          background: white;
          border: 2px solid #d69e2e;
          border-radius: 15px;
          padding: 50px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          max-width: 650px;
          margin: 0 auto;
          position: relative;
        }
        .ornament {
          text-align: center;
          font-size: 24px;
          color: #d69e2e;
          margin-bottom: 30px;
        }
        .title-thanks {
          text-align: center;
          font-size: 22px;
          color: #2d3748;
          font-weight: bold;
          margin-bottom: 40px;
          border-bottom: 2px solid #d69e2e;
          padding-bottom: 15px;
        }
        .date {
          text-align: right;
          margin-bottom: 30px;
          font-size: 13px;
          color: #718096;
        }
        .recipient {
          margin-bottom: 30px;
          font-size: 16px;
          font-weight: bold;
          text-align: center;
          color: #2d3748;
        }
        .content {
          margin-bottom: 40px;
          text-align: justify;
          line-height: 2.2;
        }
        .content p {
          margin-bottom: 1.8em;
          text-indent: 2em;
        }
        .gratitude-phrase {
          text-align: center;
          font-size: 16px;
          color: #d69e2e;
          font-weight: bold;
          margin: 30px 0;
          font-style: italic;
        }
        .signature {
          text-align: right;
          margin-top: 40px;
        }
        .signature-phrase {
          margin-bottom: 15px;
          color: #718096;
        }
        .sender-name {
          font-weight: bold;
          font-size: 16px;
          color: #2d3748;
        }
        .corner-decoration {
          position: absolute;
          font-size: 30px;
          color: #d69e2e;
          opacity: 0.3;
        }
        .top-left { top: 20px; left: 25px; }
        .top-right { top: 20px; right: 25px; }
        .bottom-left { bottom: 20px; left: 25px; }
        .bottom-right { bottom: 20px; right: 25px; }
      </style>
    </head>
    <body>
      <div class="letter-container">
        <div class="corner-decoration top-left">❀</div>
        <div class="corner-decoration top-right">❀</div>
        <div class="corner-decoration bottom-left">❀</div>
        <div class="corner-decoration bottom-right">❀</div>
        
        <div class="ornament">✿ ✿ ✿</div>
        
        <div class="title-thanks">감사의 마음을 담아</div>
        
        <div class="date">${date}</div>
        
        ${recipient ? `<div class="recipient">${recipient} 님께</div>` : ''}
        
        <div class="content">
          ${formatContentForLetter(content)}
        </div>
        
        <div class="gratitude-phrase">진심으로 감사드립니다</div>
        
        <div class="signature">
          <div class="signature-phrase">깊은 감사와 함께</div>
          <div class="sender-name">${sender || '감사하는 마음으로'}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 초대 편지 템플릿
 */
function generateInvitationLetterHTML(options: LetterExportOptions, date: string): string {
  const { content, title, recipient, sender } = options;

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title || '초대장'}</title>
      <style>
        body { 
          font-family: 'Malgun Gothic', '맑은 고딕', sans-serif;
          line-height: 1.7;
          color: #2d3748;
          margin: 0;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-size: 14px;
        }
        .invitation-card {
          background: white;
          border-radius: 15px;
          padding: 50px;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
          max-width: 600px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        .invitation-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe);
        }
        .header {
          text-align: center;
          margin-bottom: 35px;
        }
        .invitation-title {
          font-size: 24px;
          color: #667eea;
          font-weight: bold;
          margin-bottom: 12px;
        }
        .subtitle {
          font-size: 15px;
          color: #718096;
          font-style: italic;
        }
        .decorative-separator {
          text-align: center;
          font-size: 16px;
          color: #667eea;
          margin: 25px 0;
        }
        .date {
          text-align: right;
          margin-bottom: 15px;
          font-size: 12px;
          color: #4a5568;
        }
        .recipient {
          text-align: center;
          font-size: 17px;
          font-weight: bold;
          color: #2d3748;
          margin-bottom: 25px;
          padding: 12px;
          border: 2px dashed #667eea;
          border-radius: 8px;
        }
        .content {
          margin-bottom: 30px;
          text-align: center;
          line-height: 1.8;
        }
        .content p {
          margin-bottom: 1.4em;
        }
        .highlight-box {
          background: linear-gradient(135deg, #fef9e7, #fef9e7);
          border-left: 4px solid #f6ad55;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .signature {
          text-align: center;
          margin-top: 35px;
          padding-top: 25px;
          border-top: 2px solid #e2e8f0;
        }
        .signature-phrase {
          margin-bottom: 15px;
          color: #718096;
          font-style: italic;
        }
        .sender-name {
          font-weight: bold;
          font-size: 17px;
          color: #667eea;
        }
        .celebration-icons {
          text-align: center;
          font-size: 20px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="invitation-card">
        <div class="header">
          <div class="invitation-title">초대장</div>
          <div class="subtitle">특별한 순간에 함께해 주세요</div>
        </div>
        
        <div class="celebration-icons">🎉 ✨ 🎊 ✨ 🎉</div>
        
        <div class="date">${date}</div>
        
        ${recipient ? `<div class="recipient">${recipient} 님을 정중히 초대합니다</div>` : ''}
        
        <div class="decorative-separator">❋ ❋ ❋</div>
        
        <div class="content">
          ${formatContentForLetter(content)}
        </div>
        
        <div class="decorative-separator">❋ ❋ ❋</div>
        
        <div class="signature">
          <div class="signature-phrase">당신의 참석을 기다리며</div>
          <div class="sender-name">${sender || '초대하는 이'}</div>
        </div>
        
        <div class="celebration-icons">🌟 🎈 🌟</div>
      </div>
    </body>
    </html>
  `;
}

/**
 * 편지 내용을 적절한 단락으로 포맷팅
 */
function formatContentForLetter(content: string): string {
  if (!content) return '<p>내용을 입력해주세요.</p>';

  // HTML 태그 제거하고 단락으로 나누기
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // HTML 태그 제거
    .replace(/&nbsp;/g, ' ') // 공백 문자 정리
    .trim();

  if (!cleanContent) return '<p>내용을 입력해주세요.</p>';

  // 단락으로 나누기 (빈 줄 기준)
  const paragraphs = cleanContent
    .split(/\n\s*\n/)
    .filter(p => p.trim().length > 0)
    .map(p => p.replace(/\n/g, ' ').trim());

  if (paragraphs.length === 0) {
    return '<p>내용을 입력해주세요.</p>';
  }

  return paragraphs.map(p => `<p>${p}</p>`).join('\n');
}