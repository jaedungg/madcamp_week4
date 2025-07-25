import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const res = await pool.query('SELECT * FROM archives');
  return NextResponse.json(res.rows);
}
