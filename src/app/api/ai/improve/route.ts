import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { IMPROVE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type { ImproveRequest } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: ImproveRequest = await request.json();
    const { text, improvements = [], tone = 'professional' } = body;

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '개선할 텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        { success: false, error: '텍스트가 너무 깁니다. (최대 3000자)' },
        { status: 400 }
      );
    }

    // 개선 요청사항 문자열 생성
    const improvementsList = improvements.length > 0 
      ? improvements.join(', ')
      : '전반적인 개선';

    // 톤별 가이드라인
    const toneGuides = {
      formal: '정중하고 격식 있는 높임말 사용',
      professional: '예의 있으면서 효율적인 비즈니스 문체',
      friendly: '따뜻하고 친근한 개인적 문체',
      casual: '편안하고 일상적인 친구 같은 문체'
    };

    // 사용자 프롬프트 생성
    const userPrompt = `다음 텍스트를 개선해주세요.

원본 텍스트:
"""
${text}
"""

개선 요청사항: ${improvementsList}
목표 톤: ${tone} (${toneGuides[tone]})

개선된 텍스트만 제공해주세요. 별도의 설명은 필요없습니다.`;

    // AI 텍스트 개선
    const result = await generateText(
      IMPROVE_SYSTEM_PROMPT,
      userPrompt,
      {
        maxTokens: Math.min(text.length * 2, 2000), // 원본의 2배 또는 최대 2000토큰
        temperature: 0.5, // 개선 작업이므로 낮은 창의성
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'AI 텍스트 개선에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
      metadata: {
        originalLength: text.length,
        improvedLength: result.content?.length || 0,
        improvements: improvements,
        tone,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: unknown) {
    console.error('Improve API 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '프롬 AI 텍스트 개선 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '기존 텍스트를 더 자연스럽고 효과적으로 개선합니다.',
      supportedTones: ['formal', 'professional', 'friendly', 'casual'],
      supportedImprovements: [
        '문법 개선',
        '자연스러운 표현',
        '감정 전달력 향상',
        '명확성 개선',
        '간결성 개선'
      ]
    },
    { status: 200 }
  );
}