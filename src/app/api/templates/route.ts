import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Template creation schema
const createTemplateSchema = z.object({
  title: z.string().min(1, '제목을 입력해주세요').max(255, '제목이 너무 깁니다'),
  content: z.string().min(1, '내용을 입력해주세요'),
  category: z.enum(['email', 'letter', 'creative', 'business', 'personal', 'draft', 'other']),
  tags: z.array(z.string()).default([]),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tone: z.enum(['formal', 'professional', 'friendly', 'casual', 'creative']).default('professional'),
  estimatedWords: z.number().int().positive().optional(),
  preview: z.string().optional()
});

// Template update schema
const updateTemplateSchema = createTemplateSchema.partial();

// GET - 사용자의 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const includeBuiltIn = searchParams.get('includeBuiltIn') === 'true';
    const sortBy = searchParams.get('sortBy') || 'updated_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const whereClause = {
      is_template: true,
      OR: [
        { user_id: session.user.id },
        ...(includeBuiltIn ? [{ is_built_in: true }] : [])
      ],
      ...(category && category !== 'all' ? { category } : {})
    };

    const orderBy = {
      [sortBy === 'usageCount' ? 'usage_count' : sortBy]: sortOrder
    };

    const templates = await prisma.documents.findMany({
      where: whereClause,
      orderBy,
      select: {
        id: true,
        title: true,
        content: true,
        excerpt: true,
        word_count: true,
        category: true,
        tags: true,
        is_favorite: true,
        is_template: true,
        difficulty: true,
        tone: true,
        estimated_words: true,
        is_built_in: true,
        usage_count: true,
        preview: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
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
      }))
    });

  } catch (error) {
    console.error('템플릿 조회 실패:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 조회에 실패했습니다' },
      { status: 500 }
    );
  }
}

// POST - 새 템플릿 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createTemplateSchema.parse(body);

    // 미리보기 텍스트 생성
    const preview = validatedData.preview || 
      validatedData.content.replace(/<[^>]*>/g, '').substring(0, 100);

    const template = await prisma.documents.create({
      data: {
        user_id: session.user.id,
        title: validatedData.title,
        content: validatedData.content,
        excerpt: preview,
        word_count: validatedData.estimatedWords || validatedData.content.length,
        category: validatedData.category,
        tags: validatedData.tags,
        status: 'completed',
        is_favorite: false,
        ai_requests_used: 0,
        is_template: true,
        difficulty: validatedData.difficulty,
        tone: validatedData.tone,
        estimated_words: validatedData.estimatedWords || validatedData.content.length,
        is_built_in: false,
        usage_count: 0,
        preview
      }
    });

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error('템플릿 생성 실패:', error);
    return NextResponse.json(
      { success: false, error: '템플릿 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}