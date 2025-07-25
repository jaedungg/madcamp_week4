import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { getPromptTemplate, interpolatePrompt } from '@/lib/ai/prompts';
import type { GenerateRequest } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: GenerateRequest = await request.json();
    const { prompt, type = 'business-email', tone = 'professional', length = 'medium', context = '' } = body;

    // 입력 검증
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '작성할 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { success: false, error: '입력 내용이 너무 깁니다. (최대 1000자)' },
        { status: 400 }
      );
    }

    // 프롬프트 템플릿 가져오기
    const template = getPromptTemplate(type);
    
    // 사용자 프롬프트 생성
    const userPrompt = interpolatePrompt(template.user, {
      prompt,
      tone,
      length,
      context
    });

    // 길이별 토큰 제한 설정
    const maxTokensMap = {
      short: 800,
      medium: 1500,
      long: 2500
    };

    // AI 텍스트 생성
    const result = await generateText(
      template.system,
      userPrompt,
      {
        maxTokens: maxTokensMap[length],
        temperature: 0.7,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'AI 텍스트 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
      metadata: {
        type,
        tone,
        length,
        promptLength: prompt.length,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: unknown) {
    console.error('Generate API 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '프롬 AI 텍스트 생성 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '사용자의 요청에 따라 한국어 텍스트를 생성합니다.'
    },
    { status: 200 }
  );
}