import { NextRequest, NextResponse } from 'next/server';
import { generateText } from '@/lib/ai/gemini';
import { PREDICT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import type { PredictRequest, PredictResponse } from '@/lib/ai/types';

export async function POST(request: NextRequest): Promise<NextResponse<PredictResponse>> {
  try {
    const body = await request.json() as PredictRequest;
    const { text, cursorPosition, maxLength = 50 } = body;

    // 입력 검증
    if (!text || typeof text !== 'string') {
      return NextResponse.json({
        success: false,
        error: '텍스트를 입력해주세요.'
      }, { status: 400 });
    }

    // 최소 텍스트 길이 체크 (예측 품질 향상)
    if (text.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: '예측을 위해서는 최소 5글자 이상 입력해주세요.'
      }, { status: 400 });
    }

    // 너무 긴 텍스트 제한 (성능 및 비용 고려)
    if (text.length > 2000) {
      return NextResponse.json({
        success: false,
        error: '텍스트가 너무 깁니다. 2000자 이하로 입력해주세요.'
      }, { status: 400 });
    }

    // 커서 위치가 지정된 경우 해당 위치까지의 텍스트만 사용
    let contextText = text;
    if (typeof cursorPosition === 'number' && cursorPosition >= 0 && cursorPosition <= text.length) {
      contextText = text.substring(0, cursorPosition);
    }

    // 예측을 위한 사용자 프롬프트 생성
    const userPrompt = `다음 텍스트의 뒤에 이어질 내용을 예측해주세요. 현재 텍스트의 톤과 문맥을 유지하며, ${maxLength}단어 이내로 자연스럽게 연결되는 내용을 제공해주세요:

"${contextText}"`;

    // Gemini API를 사용한 텍스트 예측
    const result = await generateText(
      PREDICT_SYSTEM_PROMPT,
      userPrompt,
      {
        maxTokens: Math.min(maxLength * 2, 200), // 단어당 약 2토큰 추정
        temperature: 0.7, // 적당한 창의성
        topP: 0.9
      }
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || '텍스트 예측에 실패했습니다.'
      }, { status: 500 });
    }

    // 예측 결과 후처리
    let prediction = result.content?.trim() || '';
    
    // 따옴표나 불필요한 문자 제거
    prediction = prediction.replace(/^["']|["']$/g, '');
    
    // 너무 긴 예측 결과 자르기
    if (prediction.length > maxLength * 10) { // 한글 기준 대략적 길이 제한
      const sentences = prediction.split(/[.!?。]/);
      prediction = sentences[0];
      if (prediction.length > maxLength * 10) {
        prediction = prediction.substring(0, maxLength * 10) + '...';
      }
    }

    return NextResponse.json({
      success: true,
      content: prediction,
      prediction: prediction,
      usage: result.usage
    });

  } catch (error) {
    console.error('Predict API error:', error);
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 });
  }
}