
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type { AIResponse, AIConfig, AIError } from "./types";

const MODEL_NAME = "gemini-1.5-flash-latest";
const API_KEY = process.env.GOOGLE_API_KEY || "";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// 기본 AI 설정
export const DEFAULT_AI_CONFIG: AIConfig = {
  maxTokens: 2000,
  temperature: 0.7,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
  model: "gemini-2.5-flash"
};

const generationConfig = (config: Partial<AIConfig>) => ({
  temperature: config.temperature,
  topP: config.topP,
  maxOutputTokens: config.maxTokens,
});

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

/**
 * Gemini API를 사용해 텍스트 생성
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  config: Partial<AIConfig> = {}
): Promise<AIResponse> {
  if (!API_KEY) {
    return {
      success: false,
      error: "GOOGLE_API_KEY is not configured.",
    };
  }

  try {
    const finalConfig = { ...DEFAULT_AI_CONFIG, ...config };

    const chat = model.startChat({
      generationConfig: generationConfig(finalConfig),
      safetySettings,
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }],
        },
        {
          role: "model",
          parts: [{ text: "Okay, I will follow your instructions." }],
        },
      ],
    });

    const result = await chat.sendMessage(userPrompt);
    const response = result.response;
    const content = response.text();

    // Gemini API는 토큰 수를 직접 반환하지 않으므로, 필요 시 추정해야 합니다.
    const promptTokens = await model.countTokens(userPrompt);
    const completionTokens = await model.countTokens(content);

    return {
      success: true,
      content: content.trim(),
      usage: {
        promptTokens: promptTokens.totalTokens,
        completionTokens: completionTokens.totalTokens,
        totalTokens: promptTokens.totalTokens + completionTokens.totalTokens,
      },
    };
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
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

  const chat = model.startChat({
    generationConfig: generationConfig(finalConfig),
    safetySettings,
    history: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
      {
        role: "model",
        parts: [{ text: "Okay, I will follow your instructions." }],
      },
    ],
  });

  const result = await chat.sendMessageStream(userPrompt);

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return "An unknown error occurred with the AI service.";
}
