import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateText } from '@/lib/ai/gemini';
import { z } from 'zod';

// Template generation request schema
const generateTemplateSchema = z.object({
  prompt: z.string().min(1, '프롬프트를 입력해주세요'),
  category: z.enum(['email', 'letter', 'creative', 'business', 'personal', 'draft', 'other']),
  tone: z.enum(['formal', 'professional', 'friendly', 'casual', 'creative']).default('professional'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  estimatedWords: z.number().int().positive().default(200),
  includeVariables: z.boolean().default(true) // 템플릿에 변수 포함 여부
});

// POST - AI 기반 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = generateTemplateSchema.parse(body);

    // 카테고리별 한국어 레이블
    const categoryLabels = {
      email: '이메일',
      letter: '편지',
      creative: '창작글',
      business: '업무용',
      personal: '개인적',
      draft: '초안',
      other: '기타'
    };

    // 톤별 한국어 레이블
    const toneLabels = {
      formal: '격식체',
      professional: '전문적',
      friendly: '친근한',
      casual: '캐주얼',
      creative: '창의적'
    };

    // 난이도별 한국어 레이블
    const difficultyLabels = {
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급'
    };

    // 시스템 프롬프트와 사용자 프롬프트 분리
    const systemPrompt = `
당신은 한국어 템플릿 생성 전문가입니다. 자연스럽고 실용적인 한국어 템플릿을 생성합니다.

**핵심 원칙:**
1. 자연스럽고 한국어다운 표현 사용
2. 재사용 가능한 템플릿 형태로 작성
3. 지정된 톤과 난이도를 일관성 있게 유지
4. 명확한 문단 구조와 흐름
5. 템플릿 내용만 반환, 추가 설명 없음

**변수 사용 규칙:**
- 재사용을 위해 [이름], [회사명], [날짜], [제목] 등의 변수를 적절히 포함
- 변수는 대괄호 [] 안에 한국어로 명시
- 사용자가 쉽게 수정할 수 있도록 구성
`;

    const userPrompt = `
다음 조건에 맞는 ${categoryLabels[validatedData.category]} 템플릿을 생성해주세요:

- 주제: ${validatedData.prompt}
- 톤: ${toneLabels[validatedData.tone]}
- 난이도: ${difficultyLabels[validatedData.difficulty]}
- 예상 글자 수: 약 ${validatedData.estimatedWords}자
- 변수 포함: ${validatedData.includeVariables ? '예 (재사용 가능하도록)' : '아니오 (구체적 내용으로)'}

${validatedData.category === 'email' ? '이메일 형식(제목, 인사말, 본문, 맺음말)을 포함해주세요.' : ''}
${validatedData.category === 'business' ? '업무용 문서로서 전문성과 명확성을 강조해주세요.' : ''}
${validatedData.category === 'creative' ? '창의적이고 독창적인 표현을 사용해주세요.' : ''}

템플릿 내용만 반환해주세요.
`;

    // AI 콘텐츠 생성
    const result = await generateText(systemPrompt, userPrompt);

    if (!result.success || !result.content) {
      throw new Error(result.error || 'AI 콘텐츠 생성에 실패했습니다');
    }

    const generatedContent = result.content;

    // 제목 자동 생성 (프롬프트의 첫 몇 단어 사용)
    const autoTitle = validatedData.prompt.split(' ').slice(0, 5).join(' ') + ' 템플릿';
    
    // 미리보기 텍스트 생성
    const preview = generatedContent.replace(/<[^>]*>/g, '').substring(0, 100);

    // 태그 자동 생성
    const autoTags = [
      categoryLabels[validatedData.category],
      toneLabels[validatedData.tone],
      ...validatedData.prompt.split(' ').slice(0, 3)
    ];

    return NextResponse.json({
      success: true,
      generatedTemplate: {
        title: autoTitle,
        content: generatedContent,
        category: validatedData.category,
        tone: validatedData.tone,
        difficulty: validatedData.difficulty,
        estimatedWords: validatedData.estimatedWords,
        preview: preview,
        tags: autoTags,
        metadata: {
          prompt: validatedData.prompt,
          includeVariables: validatedData.includeVariables,
          generatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('AI 템플릿 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: 'AI 템플릿 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

// GET - 템플릿 생성 예시 프롬프트 제공
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as keyof typeof examplePrompts || 'business';

    const examplePrompts = {
      email: [
        '회의 일정 조정 요청 이메일',
        '프로젝트 진행 상황 보고 이메일',
        '고객 감사 인사 이메일',
        '업무 협조 요청 이메일',
        '연차 신청 이메일'
      ],
      letter: [
        '생일 축하 편지',
        '감사 인사 편지',
        '사과 편지',
        '격려 편지',
        '추천서 편지'
      ],
      business: [
        '사업 제안서',
        '업무 보고서',
        '회의록',
        '프로젝트 계획서',
        '성과 평가서'
      ],
      creative: [
        '일기 쓰기',
        '여행 후기',
        '독서 감상문',
        '영화 리뷰',
        '에세이'
      ],
      personal: [
        '자기소개서',
        '개인 성찰 일지',
        '목표 설정 계획',
        '감정 정리 글',
        '경험 정리 글'
      ]
    };

    return NextResponse.json({
      success: true,
      examples: examplePrompts[category] || examplePrompts.business,
      tips: [
        '구체적인 상황이나 목적을 명시하면 더 정확한 템플릿을 생성할 수 있습니다',
        '원하는 톤과 난이도를 선택하여 용도에 맞는 템플릿을 만들어보세요',
        '생성된 템플릿은 수정하여 개인화할 수 있습니다'
      ]
    });

  } catch (error) {
    console.error('예시 프롬프트 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '예시 프롬프트 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}