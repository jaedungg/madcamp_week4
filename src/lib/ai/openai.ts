import OpenAI from 'openai';
import type { AIResponse, AIConfig, AIError } from './types';

// OpenAI 클라이언트 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 기본 AI 설정
export const DEFAULT_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini', // 비용 효율적이면서 성능 좋은 모델
  maxTokens: 2000,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

/**
 * OpenAI API를 사용해 텍스트 생성
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  config: Partial<AIConfig> = {}
): Promise<AIResponse> {
  try {
    const finalConfig = { ...DEFAULT_AI_CONFIG, ...config };
    
    const completion = await openai.chat.completions.create({
      model: finalConfig.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      max_tokens: finalConfig.maxTokens,
      temperature: finalConfig.temperature,
      top_p: finalConfig.topP,
      frequency_penalty: finalConfig.frequencyPenalty,
      presence_penalty: finalConfig.presencePenalty,
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('AI 응답에서 콘텐츠를 찾을 수 없습니다.');
    }

    return {
      success: true,
      content: content.trim(),
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0,
      },
    };
  } catch (error: unknown) {
    console.error('OpenAI API 오류:', error);
    
    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
}

/**
 * 스트리밍 텍스트 생성 (실시간 응답용)
 */
export async function generateTextStream(
  systemPrompt: string,
  userPrompt: string,
  config: Partial<AIConfig> = {}
): Promise<ReadableStream> {
  const finalConfig = { ...DEFAULT_AI_CONFIG, ...config };
  
  const stream = await openai.chat.completions.create({
    model: finalConfig.model,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ],
    max_tokens: finalConfig.maxTokens,
    temperature: finalConfig.temperature,
    top_p: finalConfig.topP,
    frequency_penalty: finalConfig.frequencyPenalty,
    presence_penalty: finalConfig.presencePenalty,
    stream: true,
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * OpenAI API 연결 상태 확인
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await openai.models.list();
    return true;
  } catch (error) {
    console.error('OpenAI 연결 확인 실패:', error);
    return false;
  }
}

/**
 * 에러 메시지 파싱
 */
function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    // @ts-expect-error: dynamic error shape
    if (error.error?.message) return error.error.message;
    // @ts-expect-error: dynamic error shape
    if (error.message) return error.message;
    // @ts-expect-error: dynamic error shape
    if (error.code === 'insufficient_quota') return 'OpenAI API 할당량이 부족합니다. 결제 정보를 확인해주세요.';
    // @ts-expect-error: dynamic error shape
    if (error.code === 'invalid_api_key') return 'OpenAI API 키가 유효하지 않습니다.';
    // @ts-expect-error: dynamic error shape
    if (error.code === 'rate_limit_exceeded') return 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.';
  }
  return 'AI 서비스에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

/**
 * 토큰 수 추정 (대략적)
 */
export function estimateTokens(text: string): number {
  // 한국어는 영어보다 토큰 수가 많을 수 있으므로 조금 높게 추정
  return Math.ceil(text.length / 3);
}

/**
 * 비용 계산 (GPT-4o-mini 기준)
 */
export function calculateCost(promptTokens: number, completionTokens: number): number {
  // GPT-4o-mini 가격: $0.000150 / 1K input tokens, $0.000600 / 1K output tokens
  const inputCost = (promptTokens / 1000) * 0.000150;
  const outputCost = (completionTokens / 1000) * 0.000600;
  
  return inputCost + outputCost;
}