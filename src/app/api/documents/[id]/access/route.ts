// app/api/documents/[id]/access/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { time_spent, user_id } = body
    const document = await prisma.documents.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const access_log = await prisma.document_access_logs.create({ 
      data: {
        document_id: params.id,
        user_id: user_id,
        time_spent: time_spent
      }
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error('Error creating document: ', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}