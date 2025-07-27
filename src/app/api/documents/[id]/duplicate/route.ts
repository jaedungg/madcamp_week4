// app/api/documents/[id]/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const document = await prisma.documents.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    const new_document = await prisma.documents.create({
      data: {
        title: `${document.title} (Copy)`,
        content: document.content,
        category: document.category,
        tags: document.tags,
        user_id: document.user_id,
        excerpt: document.excerpt,
        word_count: document.word_count,
        status: document.status,
        is_favorite: document.is_favorite,
        ai_requests_used: document.ai_requests_used,
      }
    })

    return NextResponse.json({ success: true, document: new_document }, { status: 201 })
  } catch (error) {
    console.error('Error creating document: ', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}