// src/app/api/user/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import pool from '@/lib/db';
import { z } from 'zod';
import { authOptions } from '../../auth/[...nextauth]/route';

// 요청 유효성 검사 스키마
const updateSchema = z.object({
  name: z.string().optional(),
  password: z.string().min(6).optional(),
  profile_image: z.string().optional(),
});

// src/app/api/user/[id]/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = (await params).id;

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const result = await pool.query(
    `SELECT id, name, email, profile_image, created_at FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
  }

  return new Response(JSON.stringify(result.rows[0]), { status: 200 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = (await params).id;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: '입력값이 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    const { name, password, profile_image } = parsed.data;

    // 업데이트할 필드 준비
    const updates: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const values: any[] = [];
    let index = 1;

    if (name) {
      updates.push(`name = $${index++}`);
      values.push(name);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${index++}`);
      values.push(hashedPassword);
    }

    if (profile_image) {
      updates.push(`profile_image = $${index++}`);
      values.push(profile_image);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: '업데이트할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    // WHERE 절에 사용할 user ID
    values.push(userId);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${index}
      RETURNING id, name, email, profile_image
    `;

    console.log("query: ", query)
    console.log("values: ", values);

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: '해당 유저를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('User update error:', err);
    return NextResponse.json(
      { success: false, error: '유저 정보 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
