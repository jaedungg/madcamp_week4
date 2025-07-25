import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { EXPAND_SYSTEM_PROMPT } from '@/lib/ai/prompts';

interface ExpandRequest {
  text: string;
  expansionType?: 'detail' | 'context' | 'emotion' | 'example';
  length?: 'medium' | 'long' | 'very-long';
  tone?: 'formal' | 'professional' | 'friendly' | 'casual';
}

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: ExpandRequest = await request.json();
    const { text, expansionType = 'detail', length = 'medium', tone = 'professional' } = body;

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '확장할 텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (text.length < 10) {
      return NextResponse.json(
        { success: false, error: '확장하기에는 텍스트가 너무 짧습니다. (최소 10자)' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { success: false, error: '텍스트가 너무 깁니다. (최대 2000자)' },
        { status: 400 }
      );
    }

    // 확장 유형별 가이드
    const expansionGuides = {
      detail: '구체적인 설명과 세부사항을 추가하여 더 자세하게',
      context: '배경 정보와 상황 설명을 보강하여 맥락을 풍부하게',
      emotion: '감정과 느낌을 더 풍부하게 표현하여 감동적으로',
      example: '구체적인 예시와 사례를 들어 이해하기 쉽게'
    };

    // 길이별 확장 비율
    const lengthGuides = {
      medium: '원문의 1.5-2배 길이로 적절히 확장',
      long: '원문의 2-3배 길이로 상세히 확장',
      'very-long': '원문의 3-4배 길이로 매우 상세히 확장'
    };

    // 톤별 가이드라인
    const toneGuides = {
      formal: '정중하고 격식 있는 높임말',
      professional: '예의 있으면서 효율적인 비즈니스 문체',
      friendly: '따뜻하고 친근한 문체',
      casual: '편안하고 일상적인 문체'
    };

    // 사용자 프롬프트 생성
    const userPrompt = `다음 텍스트를 확장해주세요.

원본 텍스트:
"""
${text}
"""

확장 유형: ${expansionType} (${expansionGuides[expansionType]})
확장 길이: ${length} (${lengthGuides[length]})
톤: ${tone} (${toneGuides[tone]})

확장 시 주의사항:
1. 원본의 핵심 메시지와 의도 유지
2. 자연스러운 문단 구성과 매끄러운 흐름
3. 연결어와 전환 표현으로 자연스러운 연결
4. 한국어다운 자연스러운 표현 사용
5. 불필요한 반복이나 중복 표현 지양

확장된 텍스트만 제공해주세요. 별도의 설명은 필요없습니다.`;

    // 길이별 최대 토큰 설정
    const maxTokensMap = {
      medium: Math.min(text.length * 2, 1500),
      long: Math.min(text.length * 3, 2500),
      'very-long': Math.min(text.length * 4, 3500)
    };

    // AI 텍스트 확장
    const result = await generateText(
      EXPAND_SYSTEM_PROMPT,
      userPrompt,
      {
        maxTokens: maxTokensMap[length],
        temperature: 0.6, // 확장이므로 적절한 창의성 필요
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'AI 텍스트 확장에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 확장률 계산
    const expansionRatio = result.content 
      ? Math.round((result.content.length / text.length) * 100)
      : 0;

    // 성공 응답
    return NextResponse.json({
      success: true,
      content: result.content,
      usage: result.usage,
      metadata: {
        originalLength: text.length,
        expandedLength: result.content?.length || 0,
        expansionRatio: `${expansionRatio}%`,
        expansionType,
        length,
        tone,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: unknown) {
    console.error('Expand API 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '프롬 AI 텍스트 확장 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '짧은 텍스트를 더 상세하고 풍부하게 확장합니다.',
      supportedExpansionTypes: [
        { name: 'detail', description: '구체적인 설명과 세부사항을 추가하여 더 자세하게' },
        { name: 'context', description: '배경 정보와 상황 설명을 보강하여 맥락을 풍부하게' },
        { name: 'emotion', description: '감정과 느낌을 더 풍부하게 표현하여 감동적으로' },
        { name: 'example', description: '구체적인 예시와 사례를 들어 이해하기 쉽게' }
      ],
      supportedLengths: [
        { name: 'medium', description: '원문의 1.5-2배 길이로 적절히 확장' },
        { name: 'long', description: '원문의 2-3배 길이로 상세히 확장' },
        { name: 'very-long', description: '원문의 3-4배 길이로 매우 상세히 확장' }
      ],
      limits: {
        minLength: 10,
        maxLength: 2000
      }
    },
    { status: 200 }
  );
}