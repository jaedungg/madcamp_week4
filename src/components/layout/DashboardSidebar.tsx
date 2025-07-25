'use client';

import React from 'react';
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
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo & Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">From</h1>
            <p className="text-xs text-muted-foreground">AI 글쓰기 도우미</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                item.primary
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
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
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">설정</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          className="w-full flex items-center gap-3 p-3 rounded-lg text-left text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">김프롬</div>
            <div className="text-xs text-muted-foreground">무료 플랜</div>
          </div>
        </motion.button>
      </div>
    </div>
  );
}