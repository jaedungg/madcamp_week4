'use client';

import React from 'react';
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
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { useSession } from 'next-auth/react';

const menuItems = [
  {
    icon: Plus,
    label: '새 문서',
    href: '/editor',
    primary: true
  },
  {
    icon: FileText,
    label: '모든 문서',
    href: '/documents'
  },
  {
    icon: Clock,
    label: '최근 문서',
    href: '/recent'
  },
  {
    icon: BookTemplate,
    label: '템플릿',
    href: '/templates'
  }
];

const templateCategories = [
  {
    icon: Mail,
    label: '이메일',
    count: 12
  },
  {
    icon: MessageSquare,
    label: '편지',
    count: 8
  },
  {
    icon: PenTool,
    label: '창작글',
    count: 6
  }
];

export default function DashboardSidebar() {
  const session = useSession();
  const userData = session.data;
  console.log("userData:", userData);

  const pathname = usePathname();
  const { profile, plan } = useUserStore();
  
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
        {menuItems.map((item, index) => {
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
                  className="w-full flex items-center justify-between p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{category.label}</span>
                  </div>
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {category.count}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
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
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground">{profile.name}</div>
              <div className="text-xs text-muted-foreground">{plan.displayName}</div>
            </div>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}