// src/lib/api/auth.ts
import { getSession } from "next-auth/react";
import { Session } from "next-auth";

// 확장된 Session 타입 정의
export interface ExtendedSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * 현재 사용자 세션을 가져옵니다
 * @returns 사용자 세션 또는 null
 */
export async function getCurrentSession(): Promise<ExtendedSession | null> {
  try {
    const session = await getSession();
    
    // 세션이 있고 user.id가 있는지 확인
    if (session?.user?.id) {
      return session as ExtendedSession;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * 현재 사용자 ID를 가져옵니다
 * @returns 사용자 ID 또는 null
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user?.id || null;
}

/**
 * 사용자가 로그인되어 있는지 확인합니다
 * @returns 로그인 여부
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return !!session?.user?.id;
}

/**
 * 인증이 필요한 페이지에서 사용하는 가드 함수
 * @returns 사용자 ID 또는 에러 발생
 * @throws 로그인하지 않은 경우 에러
 */
export async function requireAuthentication(): Promise<string> {
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error('AUTHENTICATION_REQUIRED');
  }
  
  return userId;
}

/**
 * 클라이언트 사이드에서 사용하는 세션 훅
 */
export function useAuthSession() {
  // 이 부분은 컴포넌트에서 직접 사용
  // import { useSession } from "next-auth/react";
  // const { data: session, status } = useSession();
  // 
  // return {
  //   session: session as ExtendedSession | null,
  //   isLoading: status === "loading",
  //   isAuthenticated: !!session?.user?.id,
  //   userId: session?.user?.id || null,
  // };
}

// 타입 확장을 위한 NextAuth 모듈 선언
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}