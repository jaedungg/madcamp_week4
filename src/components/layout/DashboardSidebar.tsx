'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  PenTool,
  FileText,
  Plus,
  Clock,
  BookTemplate,
  Settings,
  User,
  Sparkles,
  Mail,
  MessageSquare,
  LogOut,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { signOut, useSession } from 'next-auth/react';
import { insertOrReplaceText } from '@/lib/ai/services';
import { useEditor } from '@/contexts/EditorContext';
import { useRouter } from 'next/navigation';

const menuItems = [
  { icon: Plus, label: '새 문서', href: '/editor', primary: true },
  { icon: FileText, label: '모든 문서', href: '/documents' },
  { icon: Clock, label: '최근 문서', href: '/recent' },
  { icon: BookTemplate, label: '템플릿', href: '/templates' },
  { icon: Crown, label: '플랜 업그레이드', href: '/upgrade', premium: true }
];

export default function DashboardSidebar() {
  const { data: session } = useSession();
  // Use email as userId fallback if id is not present
  const userId = (session?.user as { id?: string; email?: string })?.id || session?.user?.email;

  const pathname = usePathname();
  const { profile, setProfile, plan } = useUserStore();
  const { editor } = useEditor();

  // ✅ 유저 정보 fetch
  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;

      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (res.ok) {
          setProfile({
            name: data.name,
            email: data.email,
            avatar: data.profile_image || '',
          });
        } else {
          console.error('유저 정보 로딩 실패:', data.error);
        }
      } catch (err) {
        console.error('유저 정보 요청 중 에러:', err);
      }
    };

    fetchUser();
  }, [userId, setProfile]);

  const handleTemplateSelect = (templateType: string) => {
    if (!editor) return;

    const templates: Record<string, string> = {
      'business-email': `
<h3>제목: [예: 8월 프로젝트 일정 조율 및 자료 제출 요청드립니다]</h3>
<p>[받는 분 성함] 님,</p>
<p>안녕하세요. 평소 [부서명/업무 분야]에서의 업무 추진에 늘 수고가 많으십니다.</p>
<p>이번에 [프로젝트명 또는 업무명]과 관련하여 몇 가지 조율드릴 사항이 있어 연락드립니다.  
구체적으로는 다음과 같습니다:</p>
<ul>
  <li>요청 사항 1: [예: 최신 추진 일정 초안 검토 및 피드백 요청]</li>
  <li>요청 사항 2: [예: 관련 자료(예: 보고서, 데이터 시트) 8월 5일까지 공유 요청]</li>
  <li>요청 사항 3: [예: 다음 회의 일정 확정—가능한 시간대 제안 부탁드립니다]</li>
</ul>
<p>이와 관련하여 [받는 분 성함] 님의 확인이 필요한 부분은 아래와 같으며,  
가능하신 빠른 시일 내 회신 주시면 조율에 큰 도움이 될 것 같습니다:</p>
<ol>
  <li>[예: 일정 초안의 A·B 항목 중 우선순위 조정 여부]</li>
  <li>[예: 자료 형식(파워포인트/엑셀) 선호 여부]</li>
  <li>[예: 회의 가능 시간대—다음 주 3일 중 가능한 시간]</li>
</ol>
<p>추가로 필요한 정보가 있으시면 편하게 말씀해 주시고,  
필요하다면 별도 미팅을 잡아 자세히 논의드릴 수 있도록 하겠습니다.</p>
<p>감사합니다.<br>[보내는 이 성명]<br>[직책/소속]<br>[연락처 또는 이메일]</p>
`,

      'thank-you': `
<p>[성함]님께,</p>
<p>지난번에 [구체적인 도움 내용: 예: 분기 보고서 작성 과정에서 데이터 검증을 도와주신 것]에 대해 진심으로 감사드립니다.</p>
<p>덕분에 [결과/도움이 된 점: 예: 보고서 품질을 높여 경영진 리뷰에서 긍정적 피드백을 받을 수 있었고, 일정도 지킬 수 있었습니다]  
할 수 있었으며, 그 과정이 훨씬 수월해졌습니다.</p>
<p>특히 [세부적으로 인상 깊었던 부분: 예: 예상치 못한 데이터 이상치를 빠르게 잡아주신 점이나, 설명이 필요한 부분을 미리 정리해주신 점]이 큰 도움이 되었습니다.  
그 덕분에 팀 내 커뮤니케이션도 원활하게 이어졌습니다.</p>
<p>앞으로도 함께 협업할 기회가 많기를 기대하며, 필요하신 부분이 있다면 언제든지 도와드리겠습니다.</p>
<p>다시 한번 감사드리며,<br>[성명]<br>[직책/소속]<br>[연락처 또는 이메일]</p>
`,

      'apology-message': `
<p>[성함]님께,</p>
<p>먼저 지난번 [사건/상황: 예: 제출 기한을 지키지 못한 점/회의 자료에 오류가 있었던 점]에 대해 진심으로 사과드립니다.</p>
<p>제가 [잘못한 점/부족했던 부분: 예: 일정 관리가 미흡하여 예상보다 준비가 늦어졌고, 확인 절차를 충분히 거치지 않아 오류가 포함된 자료를 공유드리게 된 점]으로  
불편을 끼쳐드린 점 깊이 반성하고 있습니다.</p>
<p>앞으로는 같은 일이 재발하지 않도록 아래와 같은 개선 조치를 취하겠습니다:</p>
<ul>
  <li>개선 조치 1: [예: 일정 관리 도구를 활용해 마감 3일 전부터 중간 점검 수행]</li>
  <li>개선 조치 2: [예: 자료 공유 전 두 명 이상의 교차 검토 절차 도입]</li>
  <li>개선 조치 3: [예: 주요 커뮤니케이션 전 사전 확인 회의 설정]</li>
</ul>
<p>다시 한번 불편을 드린 점 사과드리며, 이후에는 보다 신뢰할 수 있는 방식으로 진행하겠습니다.</p>
<p>죄송합니다.<br><br>[성명]<br>[직책/소속]<br>[연락처 또는 이메일]</p>
`
    };

    const content = templates[templateType];
    if (content) {
      insertOrReplaceText(editor, content);
    }
  };

  const templateCategories = [
    { icon: Mail, label: '업무용 이메일', count: 12, onClick: () => handleTemplateSelect('business-email') },
    { icon: MessageSquare, label: '감사 인사말', count: 8, onClick: () => handleTemplateSelect('thank-you') },
    { icon: PenTool, label: '사과 메시지', count: 6, onClick: () => handleTemplateSelect('apology-message') }
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo & Header */}
      <div className="p-6 border-b border-border">
        <Link href="/editor" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">프롬</h1>
            <p className="text-xs text-muted-foreground">AI 글쓰기 도우미</p>
          </div>
        </Link>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : item.primary && pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}

        {/* Template Categories */}
        {pathname === '/editor' && (
          <div className="pt-6">
            <div className="px-3 pb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                빠른 템플릿
              </h3>
            </div>
            <div className="space-y-1">
              {templateCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <motion.button
                    key={category.label}
                    whileHover={{ scale: 1.02 }}
                    onClick={category.onClick}
                    className="w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{category.label}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Profile & Settings */}
      <div className="p-4 border-t border-border space-y-2">
        <Link href="/settings">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer',
              isActive('/settings')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">설정</span>
          </motion.div>
        </Link>

        <div>
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => signOut()}
            className={cn(
              `w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer
              text-muted-foreground hover:text-foreground hover:bg-accent`,
            )}
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">로그아웃</span>
          </motion.div>
        </div>

        <Link href="/profile">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer',
              isActive('/profile')
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {/* {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )} */}
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{profile.name || '사용자'}</div>
              <div className="text-xs text-muted-foreground">{plan.displayName}</div>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}

