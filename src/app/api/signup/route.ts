import pool from '@/lib/db';
import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();
  const file = formData.get('image') as File;

  if (!email || !password || !file) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // 비밀번호 해싱
  const hashedPassword = await bcrypt.hash(password, 10);

  // 파일 저장
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${Date.now()}_${file.name}`;
  const filepath = path.join(process.cwd(), 'public/uploads', filename);
  await writeFile(filepath, buffer);

  const imageUrl = `/uploads/${filename}`;

  const result = await pool.query(
    `INSERT INTO users (email, password, profile_image) VALUES ($1, $2, $3) RETURNING id, email, profile_image`,
    [email, hashedPassword, imageUrl]
  );

  return NextResponse.json({ user: result.rows[0] });
}
