import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { SUMMARIZE_SYSTEM_PROMPT } from '@/lib/ai/prompts';

interface SummarizeRequest {
  text: string;
  length?: 'short' | 'medium' | 'long';
  tone?: 'formal' | 'professional' | 'friendly' | 'casual';
}

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: SummarizeRequest = await request.json();
    const { text, length = 'medium', tone = 'professional' } = body;

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '요약할 텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (text.length < 100) {
      return NextResponse.json(
        { success: false, error: '요약하기에는 텍스트가 너무 짧습니다. (최소 100자)' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { success: false, error: '텍스트가 너무 깁니다. (최대 5000자)' },
        { status: 400 }
      );
    }

    // 길이별 요약 비율 설정
    const lengthGuides = {
      short: '원문의 20-30% 길이로 핵심만 간결하게',
      medium: '원문의 40-50% 길이로 주요 내용 포함',
      long: '원문의 60-70% 길이로 상세한 요약'
    };

    // 톤별 가이드라인
    const toneGuides = {
      formal: '정중하고 격식 있는 높임말',
      professional: '예의 있으면서 효율적인 비즈니스 문체',
      friendly: '따뜻하고 친근한 문체',
      casual: '편안하고 일상적인 문체'
    };

    // 사용자 프롬프트 생성
    const userPrompt = `다음 텍스트를 요약해주세요.

원본 텍스트:
"""
${text}
"""

요약 길이: ${length} (${lengthGuides[length]})
톤: ${tone} (${toneGuides[tone]})

요약 시 주의사항:
1. 가장 중요한 정보와 메시지 보존
2. 자연스럽고 읽기 쉬운 한국어
3. 원본의 톤과 감정 유지
4. 불필요한 중복과 부연설명 제거
5. 핵심 메시지가 명확히 전달되도록

요약된 텍스트만 제공해주세요. 별도의 설명은 필요없습니다.`;

    // 길이별 최대 토큰 설정
    const maxTokensMap = {
      short: Math.min(Math.floor(text.length * 0.3), 500),
      medium: Math.min(Math.floor(text.length * 0.5), 800),
      long: Math.min(Math.floor(text.length * 0.7), 1200)
    };

    // AI 텍스트 요약
    const result = await generateText(
      SUMMARIZE_SYSTEM_PROMPT,
      userPrompt,
      {
        maxTokens: maxTokensMap[length],
        temperature: 0.3, // 요약이므로 낮은 창의성으로 정확성 우선
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'AI 텍스트 요약에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 압축률 계산
    const compressionRatio = result.content 
      ? Math.round((1 - result.content.length / text.length) * 100)
      : 0;

    // 성공 응답
    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
      metadata: {
        originalLength: text.length,
        summarizedLength: result.content?.length || 0,
        compressionRatio: `${compressionRatio}%`,
        length,
        tone,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: unknown) {
    console.error('Summarize API 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '프롬 AI 텍스트 요약 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '긴 텍스트를 핵심 내용 중심으로 간결하게 요약합니다.',
      supportedLengths: [
        { name: 'short', description: '원문의 20-30% 길이로 핵심만 간결하게' },
        { name: 'medium', description: '원문의 40-50% 길이로 주요 내용 포함' },
        { name: 'long', description: '원문의 60-70% 길이로 상세한 요약' }
      ],
      limits: {
        minLength: 100,
        maxLength: 5000
      }
    },
    { status: 200 }
  );
}