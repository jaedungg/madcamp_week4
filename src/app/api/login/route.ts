import { NextRequest, NextResponse } from 'next/server';

const DUMMY_USER = {
  id: 1,
  name: '관리자',
  email: 'admin@example.com',
  password: '111111', // 실제론 DB에서 bcrypt 등으로 비교해야 함
};

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email === DUMMY_USER.email && password === DUMMY_USER.password) {
    // 비밀번호는 실제 프로젝트에서는 암호화하고 비교해야 안전합니다.
    const { password: _, ...userWithoutPassword } = DUMMY_USER;
    return NextResponse.json(userWithoutPassword);
  }

  return NextResponse.json(
    { error: '이메일 또는 비밀번호가 틀렸습니다.' },
    { status: 401 }
  );
}
