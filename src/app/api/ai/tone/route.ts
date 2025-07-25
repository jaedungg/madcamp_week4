import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { TONE_CHANGE_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type { ToneChangeRequest } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: ToneChangeRequest = await request.json();
    const { text, currentTone, targetTone } = body;

    // 입력 검증
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '톤을 변경할 텍스트를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { success: false, error: '텍스트가 너무 깁니다. (최대 2000자)' },
        { status: 400 }
      );
    }

    const validTones = ['formal', 'professional', 'friendly', 'casual'];
    if (!validTones.includes(currentTone) || !validTones.includes(targetTone)) {
      return NextResponse.json(
        { success: false, error: '올바른 톤을 선택해주세요.' },
        { status: 400 }
      );
    }

    if (currentTone === targetTone) {
      return NextResponse.json(
        { success: false, error: '현재 톤과 목표 톤이 동일합니다.' },
        { status: 400 }
      );
    }

    // 톤별 상세 가이드
    const toneDescriptions = {
      formal: '높임말과 정중한 표현을 사용하는 격식 있는 문체 (님, 께서, 드립니다, 하십시오)',
      professional: '예의 있으면서 효율적인 비즈니스 문체 (입니다, 합니다, 해주세요)',
      friendly: '따뜻하고 친근하면서도 예의를 지키는 문체 (요, 세요, 어떠세요)',
      casual: '편안하고 자연스러운 일상 대화체 (이야, 야, 해, 지, 어?)'
    };

    // 사용자 프롬프트 생성
    const userPrompt = `다음 텍스트의 톤을 변경해주세요.

원본 텍스트:
"""
${text}
"""

현재 톤: ${currentTone} (${toneDescriptions[currentTone]})
목표 톤: ${targetTone} (${toneDescriptions[targetTone]})

변경 시 주의사항:
1. 원본의 핵심 내용과 의미는 그대로 유지
2. ${targetTone} 톤에 맞는 자연스러운 한국어 표현 사용
3. 어색하거나 과도한 표현은 피하고 자연스럽게
4. 문맥과 상황에 적절한 표현 선택

톤이 변경된 텍스트만 제공해주세요. 별도의 설명은 필요없습니다.`;

    // AI 톤 변경
    const result = await generateText(
      TONE_CHANGE_SYSTEM_PROMPT,
      userPrompt,
      {
        maxTokens: Math.min(text.length * 1.5, 1500), // 원본의 1.5배 또는 최대 1500토큰
        temperature: 0.4, // 톤 변경이므로 낮은 창의성으로 정확성 향상
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'AI 톤 변경에 실패했습니다.' },
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
        changedLength: result.content?.length || 0,
        currentTone,
        targetTone,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: unknown) {
    console.error('Tone Change API 오류:', error);
    
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: '프롬 AI 톤 변경 API',
      version: '1.0.0',
      methods: ['POST'],
      description: '텍스트의 톤을 다른 스타일로 자연스럽게 변경합니다.',
      supportedTones: [
        {
          name: 'formal',
          description: '높임말과 정중한 표현을 사용하는 격식 있는 문체',
          examples: ['님', '께서', '드립니다', '하십시오']
        },
        {
          name: 'professional', 
          description: '예의 있으면서 효율적인 비즈니스 문체',
          examples: ['입니다', '합니다', '해주세요']
        },
        {
          name: 'friendly',
          description: '따뜻하고 친근하면서도 예의를 지키는 문체',
          examples: ['요', '세요', '어떠세요']
        },
        {
          name: 'casual',
          description: '편안하고 자연스러운 일상 대화체',
          examples: ['이야', '야', '해', '지', '어?']
        }
      ]
    },
    { status: 200 }
  );
}