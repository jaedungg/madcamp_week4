// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // 미들웨어가 실행되는지 확인하기 위한 로그
  console.log('🛡 Middleware executing for:', pathname);
  
  // 모든 요청에 대해 로그 출력 (디버깅용)
  console.log('Request URL:', req.url);
  console.log('Pathname:', pathname);

  // /editor 경로와 그 하위 경로들을 보호
  if (pathname.startsWith('/editor')) {
    console.log('🔍 Checking auth for /editor route');
    
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === 'production'
      });
      
      console.log('Token exists:', !!token);
      console.log('Token data:', token);

      // 토큰이 없으면 로그인 페이지로 리디렉션
      if (!token) {
        console.log('🔒 No token found, redirecting to login');
        const loginUrl = new URL('/login', req.url);
        loginUrl.searchParams.set('callbackUrl', req.url);
        console.log('Redirecting to:', loginUrl.toString());
        return NextResponse.redirect(loginUrl);
      }
      
      console.log('✅ Token found, allowing access');
    } catch (error) {
      console.error('❌ Error in middleware:', error);
    }
  }

  console.log('⏭️ Middleware continuing to next');
  return NextResponse.next();
}

export const config = {
  // 더 넓은 범위로 matcher 설정
  matcher: [
    '/editor',
    '/editor/(.*)',
    '/'
    // 또는 다음과 같이 설정할 수도 있습니다:
    // '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};