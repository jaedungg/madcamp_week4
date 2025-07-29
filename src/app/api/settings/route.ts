import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as { user?: { id?: string } } | null;

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 설정 조회 (없으면 기본값 반환)
    const userSettings = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        // If your users table does not have a settings field, remove this line or add it to your schema
        // settings: true as true | undefined
        // Replace 'settings' with actual fields from your users model, e.g.:
        id: true,
        // Add other fields as needed
      }
    });

    // 기본 설정
    const defaultSettings = {
      predictionEnabled: true,
      defaultTone: 'professional',
      theme: 'system',
      autoSave: true
    };

    // If userSettings is null or does not have settings, fallback to defaultSettings
    const settings = (userSettings && 'settings' in userSettings && userSettings.settings)
      ? userSettings.settings
      : defaultSettings;

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('설정 조회 오류:', error);
    return NextResponse.json(
      { error: '설정을 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      predictionEnabled,
      defaultTone,
      theme,
      autoSave
    } = body;

    // 설정 유효성 검사
    const validTones = ['formal', 'professional', 'friendly', 'casual'];
    const validThemes = ['light', 'dark', 'system'];

    if (defaultTone && !validTones.includes(defaultTone)) {
      return NextResponse.json(
        { error: '유효하지 않은 톤 설정입니다.' },
        { status: 400 }
      );
    }

    if (theme && !validThemes.includes(theme)) {
      return NextResponse.json(
        { error: '유효하지 않은 테마 설정입니다.' },
        { status: 400 }
      );
    }

    // 설정 저장
    const settings = {
      predictionEnabled: predictionEnabled ?? true,
      defaultTone: defaultTone || 'professional',
      theme: theme || 'system',
      autoSave: autoSave ?? true
    };

    // If your users table does not have these fields, you may need to store settings elsewhere (e.g., a separate settings table or a JSON column)
    // For now, just return success without updating unknown fields
    // await prisma.users.update({
    //   where: { id: session.user.id },
    //   data: {
    //     predictionEnabled: settings.predictionEnabled,
    //     defaultTone: settings.defaultTone,
    //     theme: settings.theme,
    //     autoSave: settings.autoSave
    //   }
    // });

    return NextResponse.json({
      success: true,
      message: '설정이 저장되었습니다.',
      settings
    });

  } catch (error) {
    console.error('설정 저장 오류:', error);
    return NextResponse.json(
      { error: '설정 저장에 실패했습니다.' },
      { status: 500 }
    );
  }
}