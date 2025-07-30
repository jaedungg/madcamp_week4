import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Built-in templates data extracted from documentStore
const builtInTemplates = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    title: '업무 협조 요청 이메일',
    content: `제목: [프로젝트명] 관련 업무 협조 요청

안녕하세요, [받는 분 이름]님.

[보내는 사람 이름]입니다.

현재 진행 중인 [프로젝트명] 관련하여 협조를 요청드리고자 연락드립니다.

[구체적인 협조 요청 내용]

가능하시다면 [구체적인 기한]까지 [구체적인 요청사항]을 부탁드리겠습니다.

혹시 추가로 필요한 정보나 자료가 있으시면 언제든 말씀해 주세요.

바쁘신 중에도 협조해 주셔서 감사합니다.

[보내는 사람 이름]
[부서명/직책]
[연락처]`,
    preview: '동료나 다른 부서에 업무 협조를 요청할 때 사용하는 공식적인 이메일',
    category: 'email',
    tags: ['업무', '협조', '요청', '공식'],
    is_built_in: true,
    usage_count: 45,
    difficulty: 'beginner',
    estimated_words: 120,
    tone: 'professional',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000' // System user ID for built-in templates
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    title: '감사 인사 이메일',
    content: `제목: [사안] 관련 감사 인사

안녕하세요, [받는 분 이름]님.

[보내는 사람 이름]입니다.

[구체적인 도움을 받은 내용]에 대해 진심으로 감사드립니다.

덕분에 [결과/성과]를 달성할 수 있었습니다. 
특히 [구체적으로 도움이 된 부분]이 큰 도움이 되었습니다.

앞으로도 좋은 관계를 유지하며 함께 성장해 나갔으면 좋겠습니다.

다시 한 번 감사드리며, 좋은 하루 보내세요.

감사합니다.

[보내는 사람 이름]
[부서명/직책]
[연락처]`,
    preview: '도움을 받았거나 협조해 준 상대방에게 감사를 표현하는 이메일',
    category: 'email',
    tags: ['감사', '인사', '협조'],
    is_built_in: true,
    usage_count: 38,
    difficulty: 'beginner',
    estimated_words: 90,
    tone: 'friendly',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    title: '사과 메시지',
    content: `제목: [사안] 관련 사과 말씀

안녕하세요, [받는 분 이름]님.

[보내는 사람 이름]입니다.

이번 [구체적인 문제 상황]에 대해 진심으로 사과드립니다.

[구체적인 문제 내용과 원인]로 인해 불편을 끼쳐드린 점 정말 죄송합니다.

현재 [해결을 위한 조치사항]을 진행하고 있으며, 
[구체적인 해결 일정 또는 대안]을 통해 문제를 해결하겠습니다.

앞으로는 이런 일이 발생하지 않도록 [재발 방지 대책]을 마련하겠습니다.

다시 한 번 깊이 사과드리며, 양해해 주셔서 감사합니다.

[보내는 사람 이름]
[부서명/직책]
[연락처]`,
    preview: '실수나 문제 상황에 대해 진심으로 사과하는 이메일',
    category: 'email',
    tags: ['사과', '문제해결', '공식'],
    is_built_in: true,
    usage_count: 22,
    difficulty: 'intermediate',
    estimated_words: 110,
    tone: 'formal',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440004',
    title: '가족에게 보내는 편지',
    content: `사랑하는 [가족 호칭]께

그동안 안녕하셨나요? 저는 여기서 건강하게 잘 지내고 있어요.

[근황 이야기]

요즘은 [현재 하고 있는 일이나 관심사]에 푹 빠져 있답니다.
[구체적인 에피소드나 경험]

[가족에 대한 관심과 안부]

날씨가 많이 [계절 특성]해졌는데, 건강 관리 잘 하시고 계시죠?
특히 [건강에 대한 구체적인 당부]

곧 [만날 계획이나 약속]으로 뵐 수 있었으면 좋겠어요.

그때까지 건강하시고, 늘 행복하세요.

사랑하는 [보내는 사람 이름] 올림`,
    preview: '멀리 있는 가족에게 안부와 근황을 전하는 따뜻한 편지',
    category: 'letter',
    tags: ['가족', '안부', '편지'],
    is_built_in: true,
    usage_count: 31,
    difficulty: 'beginner',
    estimated_words: 100,
    tone: 'friendly',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440005',
    title: '친구에게 보내는 편지',
    content: `안녕, [친구 이름]!

오랜만이야. 잘 지내고 있지?

요즘 [현재 상황이나 근황]하면서 지내고 있어.
[구체적인 일상이나 에피소드]

그런데 말이야, [공유하고 싶은 이야기나 고민]
너라면 어떻게 생각할지 궁금하더라.

[추억이나 공통 관심사에 대한 이야기]
그때가 정말 재밌었지? 지금 생각해봐도 웃음이 나온다.

너는 요즘 어떻게 지내? [친구에 대한 관심과 질문]

시간 날 때 [만날 제안이나 연락 약속] 어때?

답장 기다릴게!

[보내는 사람 이름]`,
    preview: '오랜 친구에게 추억을 되새기며 보내는 편지',
    category: 'letter',
    tags: ['친구', '추억', '안부'],
    is_built_in: true,
    usage_count: 28,
    difficulty: 'beginner',
    estimated_words: 85,
    tone: 'casual',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440006',
    title: '일기 쓰기',
    content: `[날짜] [요일] [날씨]

오늘은 [하루의 주요 활동이나 사건]

아침에는 [아침 활동],
점심에는 [점심 시간 활동],
저녁에는 [저녁 활동]

특히 기억에 남는 것은 [인상 깊었던 일이나 만남]
[그에 대한 감정이나 생각]

오늘 하루를 돌아보니 [하루에 대한 전체적인 평가나 느낌]

내일은 [내일의 계획이나 기대]

[오늘의 감사한 점이나 배운 점]

좋은 꿈 꾸자.`,
    preview: '하루를 돌아보며 감정과 생각을 정리하는 일기',
    category: 'creative',
    tags: ['일기', '성찰', '일상'],
    is_built_in: true,
    usage_count: 42,
    difficulty: 'beginner',
    estimated_words: 70,
    tone: 'casual',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440007',
    title: '회의록 작성',
    content: `# [회의명] 회의록

## 회의 정보
- **일시**: [날짜] [시간]
- **장소**: [장소 또는 온라인 플랫폼]
- **참석자**: [참석자 명단]
- **작성자**: [작성자 이름]

## 안건
1. [안건 1]
2. [안건 2]
3. [안건 3]

## 논의 내용

### [안건 1 제목]
- **논의 사항**: [주요 논의 내용]
- **의견**: [제시된 의견들]
- **결정 사항**: [최종 결정된 내용]

### [안건 2 제목]
- **논의 사항**: [주요 논의 내용]
- **의견**: [제시된 의견들]
- **결정 사항**: [최종 결정된 내용]

## 액션 아이템
| 항목 | 담당자 | 완료 기한 | 상태 |
|------|--------|-----------|------|
| [할 일 1] | [담당자] | [날짜] | 진행중 |
| [할 일 2] | [담당자] | [날짜] | 대기 |

## 다음 회의
- **일시**: [다음 회의 날짜 및 시간]
- **안건**: [다음 회의 예상 안건]`,
    preview: '회의 내용과 결정사항을 체계적으로 정리하는 회의록',
    category: 'business',
    tags: ['회의록', '업무', '정리'],
    is_built_in: true,
    usage_count: 35,
    difficulty: 'intermediate',
    estimated_words: 150,
    tone: 'professional',
    is_template: true,
    status: 'completed',
    user_id: '00000000-0000-0000-0000-000000000000'
  }
];

async function main() {
  console.log('Starting database seeding...');

  // Create a system user for built-in templates if it doesn't exist
  const systemUser = await prisma.users.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'system@from.app',
      password: 'system', // This won't be used for login
      name: 'System',
      profile_image: null
    }
  });

  console.log('System user created/verified:', systemUser.id);

  // Seed built-in templates
  for (const template of builtInTemplates) {
    await prisma.documents.upsert({
      where: { id: template.id },
      update: {
        // Update existing templates to ensure they have the latest content
        title: template.title,
        content: template.content,
        preview: template.preview,
        category: template.category,
        tags: template.tags,
        is_built_in: template.is_built_in,
        usage_count: template.usage_count,
        difficulty: template.difficulty,
        estimated_words: template.estimated_words,
        tone: template.tone,
        is_template: template.is_template,
        status: template.status
      },
      create: {
        id: template.id,
        user_id: template.user_id,
        title: template.title,
        content: template.content,
        excerpt: template.preview,
        word_count: template.estimated_words,
        category: template.category,
        tags: template.tags,
        status: template.status,
        priority: 'medium',
        project: null,
        is_favorite: false,
        ai_requests_used: 0,
        is_template: template.is_template,
        difficulty: template.difficulty,
        tone: template.tone,
        estimated_words: template.estimated_words,
        is_built_in: template.is_built_in,
        usage_count: template.usage_count,
        preview: template.preview
      }
    });

    console.log(`Seeded template: ${template.title}`);
  }

  console.log('Built-in templates seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });