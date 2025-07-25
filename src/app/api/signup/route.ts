// src/app/api/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    // 이미 존재하는 이메일인지 확인
    const existing = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: '이미 존재하는 이메일입니다.' }, { status: 409 });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // DB 삽입
    // const result = await pool.query(
    //   `INSERT INTO users (email, password, profile_image) VALUES ($1, $2, $3) RETURNING id, email`,
    //   [email, hashedPassword, '/uploads/default.png']
    // );
    const result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: '회원가입 실패' }, { status: 500 });
  }
}
