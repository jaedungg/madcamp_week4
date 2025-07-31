/**
 * 애플리케이션 시작 시 실행되는 초기화 로직
 */

import { initializeEnvironment } from './env-validation';

/**
 * 애플리케이션 시작 시 필요한 모든 초기화 작업 수행
 */
export function initializeApplication() {
  console.log('🚀 From AI 애플리케이션 초기화 시작...');
  
  try {
    // 1. 환경변수 검증 및 로드
    const config = initializeEnvironment();
    
    // 2. 추가 초기화 작업들 (필요시)
    // - 데이터베이스 연결 확인
    // - 외부 API 연결 확인
    // - 캐시 시스템 초기화 등
    
    console.log('✅ From AI 애플리케이션 초기화 완료');
    console.log(`📦 환경: ${config.NODE_ENV}`);
    console.log(`🔐 보안: TossPayments 연동 활성화`);
    console.log(`🤖 AI: Google Gemini 연동 활성화`);
    if (config.OPENAI_API_KEY) {
      console.log(`🧠 AI: OpenAI 연동 활성화`);
    }
    
    return config;
    
  } catch (error) {
    console.error('💥 애플리케이션 초기화 실패:', error);
    
    // 개발 환경에서는 도움말 표시
    if (process.env.NODE_ENV === 'development') {
      console.log(`
📝 개발 환경 설정 가이드:

1. 프로젝트 루트에 .env 파일을 생성하세요:
   
   DATABASE_URL="postgresql://user:password@localhost:5432/from_db"
   NEXTAUTH_SECRET="your-32-character-secret-key-here"
   TOSS_CLIENT_KEY="test_ck_your_test_client_key"
   TOSS_SECRET_KEY="test_sk_your_test_secret_key"
   TOSS_WEBHOOK_SECRET="your_webhook_secret"
   GOOGLE_API_KEY="your_google_api_key"
   NODE_ENV="development"

2. 각 API 키는 해당 서비스에서 발급받으세요:
   - TossPayments: https://developers.tosspayments.com/
   - Google AI: https://ai.google.dev/
   
3. 환경변수 설정 후 애플리케이션을 다시 시작하세요.
`);
    }
    
    // 시스템 종료
    process.exit(1);
  }
}

/**
 * Next.js 서버 컴포넌트에서 사용할 수 있는 환경변수 검증
 */
export function validateServerEnvironment() {
  try {
    return initializeEnvironment();
  } catch (error) {
    console.error('서버 환경변수 검증 실패:', error);
    throw error;
  }
}