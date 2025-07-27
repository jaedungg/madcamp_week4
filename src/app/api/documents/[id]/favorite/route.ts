// app/api/documents/[id]/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT (
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { is_favorite } = body
    if ( is_favorite == undefined ) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields.' }, { status: 400 }
      )
    }
    const document = await prisma.documents.findUnique({
      where: { id: params.id },
    })

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' }, { status: 404 }
      )
    }

    const new_document = await prisma.documents.update({
      where: { id: params.id },
      data: {
        ...body,
        updated_at: new Date(),
        last_modified_at: new Date(),
      }
    })

    return NextResponse.json({ success: true, document: new_document }, { status: 200 })
  } catch (error) {
    console.error('Error creating document: ', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}