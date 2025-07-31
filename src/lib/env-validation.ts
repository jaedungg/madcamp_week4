/**
 * 환경변수 검증 유틸리티
 * 애플리케이션 시작 시 필수 환경변수들을 검증합니다.
 */

export interface EnvironmentConfig {
  // 데이터베이스
  DATABASE_URL: string;
  
  // NextAuth
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  
  // TossPayments (서버사이드)
  TOSS_SECRET_KEY: string;
  TOSS_WEBHOOK_SECRET: string;
  
  // TossPayments (클라이언트사이드)
  NEXT_PUBLIC_TOSS_CLIENT_KEY?: string;
  
  // Google AI
  GOOGLE_API_KEY: string;
  
  // OpenAI (선택사항)
  OPENAI_API_KEY?: string;
  
  // 기타
  NODE_ENV: string;
  API_BASE_URL?: string;
}

/**
 * 필수 환경변수 목록 (서버사이드)
 */
const REQUIRED_ENV_VARS: (keyof EnvironmentConfig)[] = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'TOSS_SECRET_KEY',
  'TOSS_WEBHOOK_SECRET',
  'GOOGLE_API_KEY',
  'NODE_ENV',
];

/**
 * 클라이언트사이드 필수 환경변수
 */
const CLIENT_REQUIRED_ENV_VARS: string[] = [
  'NEXT_PUBLIC_TOSS_CLIENT_KEY',
];

/**
 * 환경별 추가 필수 변수
 */
const PRODUCTION_REQUIRED_ENV_VARS: (keyof EnvironmentConfig)[] = [
  'NEXTAUTH_URL',
  'API_BASE_URL',
];

/**
 * 환경변수 검증 함수
 */
export function validateEnvironmentVariables(): EnvironmentConfig {
  const missingVars: string[] = [];
  const config: Partial<EnvironmentConfig> = {};
  
  // 기본 필수 변수 검사
  REQUIRED_ENV_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else {
      (config as any)[varName] = value;
    }
  });
  
  // 프로덕션 환경 추가 검사
  if (process.env.NODE_ENV === 'production') {
    PRODUCTION_REQUIRED_ENV_VARS.forEach((varName) => {
      const value = process.env[varName];
      if (!value || value.trim() === '') {
        missingVars.push(varName);
      } else {
        (config as any)[varName] = value;
      }
    });
  }
  
  // 클라이언트사이드 환경변수 검사
  CLIENT_REQUIRED_ENV_VARS.forEach((varName) => {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missingVars.push(varName);
    } else {
      (config as any)[varName] = value;
    }
  });
  
  // 선택적 변수들 추가
  if (process.env.OPENAI_API_KEY) {
    config.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  }
  
  if (process.env.NEXTAUTH_URL) {
    config.NEXTAUTH_URL = process.env.NEXTAUTH_URL;
  }
  
  if (process.env.API_BASE_URL) {
    config.API_BASE_URL = process.env.API_BASE_URL;
  }
  
  // 누락된 변수가 있으면 에러 발생
  if (missingVars.length > 0) {
    const errorMessage = `
❌ 필수 환경변수가 설정되지 않았습니다:

누락된 변수: ${missingVars.join(', ')}

다음 환경변수들을 .env 파일에 설정해주세요:
${missingVars.map(varName => `${varName}=your_value_here`).join('\n')}

환경변수 설정 가이드:
- DATABASE_URL: PostgreSQL 연결 문자열
- NEXTAUTH_SECRET: NextAuth.js용 랜덤 시크릿 키
- NEXT_PUBLIC_TOSS_CLIENT_KEY: TossPayments 클라이언트 키 (클라이언트사이드)
- TOSS_SECRET_KEY: TossPayments 서버 시크릿 키
- TOSS_WEBHOOK_SECRET: TossPayments 웹훅 시크릿
- GOOGLE_API_KEY: Google Gemini API 키
`;
    
    console.error(errorMessage);
    throw new Error(`필수 환경변수 누락: ${missingVars.join(', ')}`);
  }
  
  // 환경변수 값 검증
  validateEnvironmentValues(config as EnvironmentConfig);
  
  console.log('✅ 모든 필수 환경변수가 정상적으로 설정되었습니다.');
  return config as EnvironmentConfig;
}

/**
 * 환경변수 값 유효성 검증
 */
function validateEnvironmentValues(config: EnvironmentConfig): void {
  const errors: string[] = [];
  
  // DATABASE_URL 형식 검증
  if (!config.DATABASE_URL.startsWith('postgres://') && !config.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL은 PostgreSQL 연결 문자열이어야 합니다 (postgres:// 또는 postgresql://)');
  }
  
  // NEXTAUTH_SECRET 길이 검증
  if (config.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET은 최소 32자 이상이어야 합니다');
  }
  
  // TossPayments 클라이언트 키 형식 검증
  if (config.NEXT_PUBLIC_TOSS_CLIENT_KEY) {
    if (!config.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith('test_ck_') && !config.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith('live_ck_')) {
      errors.push('NEXT_PUBLIC_TOSS_CLIENT_KEY가 올바른 형식이 아닙니다 (test_ck_ 또는 live_ck_로 시작해야 함)');
    }
  }
  
  if (!config.TOSS_SECRET_KEY.startsWith('test_sk_') && !config.TOSS_SECRET_KEY.startsWith('live_sk_')) {
    errors.push('TOSS_SECRET_KEY가 올바른 형식이 아닙니다 (test_sk_ 또는 live_sk_로 시작해야 함)');
  }
  
  // 프로덕션 환경에서 테스트 키 사용 금지
  if (config.NODE_ENV === 'production') {
    if (config.NEXT_PUBLIC_TOSS_CLIENT_KEY && config.NEXT_PUBLIC_TOSS_CLIENT_KEY.startsWith('test_')) {
      errors.push('프로덕션 환경에서는 테스트 키를 사용할 수 없습니다 (NEXT_PUBLIC_TOSS_CLIENT_KEY)');
    }
    if (config.TOSS_SECRET_KEY.startsWith('test_')) {
      errors.push('프로덕션 환경에서는 테스트 키를 사용할 수 없습니다 (TOSS_SECRET_KEY)');
    }
  }
  
  if (errors.length > 0) {
    const errorMessage = `
❌ 환경변수 값이 올바르지 않습니다:

${errors.map(error => `- ${error}`).join('\n')}
`;
    console.error(errorMessage);
    throw new Error('환경변수 값 검증 실패');
  }
}

/**
 * 환경변수 초기화 (애플리케이션 시작 시 호출)
 */
export function initializeEnvironment(): EnvironmentConfig {
  try {
    console.log('🔧 환경변수 검증 중...');
    const config = validateEnvironmentVariables();
    console.log(`🚀 환경: ${config.NODE_ENV}`);
    return config;
  } catch (error) {
    console.error('💥 환경변수 초기화 실패:', error);
    process.exit(1);
  }
}

// 개발용 환경변수 가져오기 함수
export function getEnvVar(key: keyof EnvironmentConfig): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`환경변수 ${key}가 설정되지 않았습니다.`);
  }
  return value;
}