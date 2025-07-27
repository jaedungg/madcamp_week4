// src/app/api/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  console.log("입력값:", email, password);

  try {
    const { rows } = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );
    console.log("users:", rows);

    const user = rows[0];
    if (!user) return NextResponse.json(null, { status: 401 });

    const isValid = await bcrypt.compare(password, user.password);
    // if (!isValid) return NextResponse.json(null, { status: 401 }); // TODO: 회원가입 구현 이후에 활성화

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
