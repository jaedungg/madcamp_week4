import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Template update schema
const updateTemplateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(255, '제목이 너무 깁니다').optional(),
  content: z.string().min(1, '내용을 입력해주세요').optional(),
  category: z.enum(['email', 'letter', 'creative', 'business', 'personal', 'draft', 'other']).optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  tone: z.enum(['formal', 'professional', 'friendly', 'casual', 'creative']).optional(),
  estimatedWords: z.number().int().positive().optional(),
  preview: z.string().optional(),
  isFavorite: z.boolean().optional()
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - 특정 템플릿 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const template = await prisma.documents.findFirst({
      where: {
        id: params.id,
        is_template: true,
        OR: [
          { user_id: session.user.id },
          { is_built_in: true }
        ]
      }
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        description: template.preview || template.excerpt || '',
        content: template.content || '',
        preview: template.preview || template.excerpt || '',
        category: template.category,
        tags: template.tags,
        isFavorite: template.is_favorite || false,
        isBuiltIn: template.is_built_in || false,
        usageCount: template.usage_count || 0,
        difficulty: template.difficulty as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
        estimatedWords: template.estimated_words || template.word_count || 0,
        tone: template.tone as 'formal' | 'professional' | 'friendly' | 'casual' | 'creative' || 'professional',
        createdAt: template.created_at,
        updatedAt: template.updated_at
      }
    });

  } catch (error) {
    console.error('템플릿 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}

// PUT - 템플릿 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 기존 템플릿 확인
    const existingTemplate = await prisma.documents.findFirst({
      where: {
        id: params.id,
        is_template: true,
        user_id: session.user.id, // 사용자가 소유한 템플릿만 수정 가능
        is_built_in: { not: true } // 공식 템플릿은 수정 불가
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: '수정할 수 있는 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateTemplateSchema.parse(body);

    // 미리보기 텍스트 업데이트
    const preview = validatedData.preview || 
      (validatedData.content ? validatedData.content.replace(/<[^>]*>/g, '').substring(0, 100) : undefined);

    const updatedTemplate = await prisma.documents.update({
      where: { id: params.id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.content && { 
          content: validatedData.content,
          word_count: validatedData.estimatedWords || validatedData.content.length
        }),
        ...(validatedData.category && { category: validatedData.category }),
        ...(validatedData.tags && { tags: validatedData.tags }),
        ...(validatedData.difficulty && { difficulty: validatedData.difficulty }),
        ...(validatedData.tone && { tone: validatedData.tone }),
        ...(validatedData.estimatedWords && { estimated_words: validatedData.estimatedWords }),
        ...(preview && { preview, excerpt: preview }),
        ...(validatedData.isFavorite !== undefined && { is_favorite: validatedData.isFavorite }),
        updated_at: new Date(),
        last_modified_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      template: {
        id: updatedTemplate.id,
        title: updatedTemplate.title,
        description: updatedTemplate.preview || updatedTemplate.excerpt || '',
        content: updatedTemplate.content || '',
        preview: updatedTemplate.preview || updatedTemplate.excerpt || '',
        category: updatedTemplate.category,
        tags: updatedTemplate.tags,
        isFavorite: updatedTemplate.is_favorite || false,
        isBuiltIn: updatedTemplate.is_built_in || false,
        usageCount: updatedTemplate.usage_count || 0,
        difficulty: updatedTemplate.difficulty as 'beginner' | 'intermediate' | 'advanced' || 'beginner',
        estimatedWords: updatedTemplate.estimated_words || updatedTemplate.word_count || 0,
        tone: updatedTemplate.tone as 'formal' | 'professional' | 'friendly' | 'casual' | 'creative' || 'professional',
        createdAt: updatedTemplate.created_at,
        updatedAt: updatedTemplate.updated_at
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('템플릿 수정 실패:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 수정에 실패했습니다' },
      { status: 500 }
    );
  }
}

// DELETE - 템플릿 삭제  
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // 기존 템플릿 확인
    const existingTemplate = await prisma.documents.findFirst({
      where: {
        id: params.id,
        is_template: true,
        user_id: session.user.id, // 사용자가 소유한 템플릿만 삭제 가능
        is_built_in: { not: true } // 공식 템플릿은 삭제 불가
      }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { success: false, error: '삭제할 수 있는 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await prisma.documents.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: '템플릿이 성공적으로 삭제되었습니다'
    });

  } catch (error) {
    console.error('템플릿 삭제 실패:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 삭제에 실패했습니다' },
      { status: 500 }
    );
  }
}

// PATCH - 템플릿 사용 횟수 증가
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'use') {
      // 템플릿 사용 횟수 증가
      const updatedTemplate = await prisma.documents.update({
        where: { 
          id: params.id,
          is_template: true
        },
        data: {
          usage_count: {
            increment: 1
          },
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        usageCount: updatedTemplate.usage_count
      });
    }

    return NextResponse.json(
      { success: false, error: '유효하지 않은 액션입니다' },
      { status: 400 }
    );

  } catch (error) {
    console.error('템플릿 업데이트 실패:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 업데이트에 실패했습니다' },
      { status: 500 }
    );
  }
}