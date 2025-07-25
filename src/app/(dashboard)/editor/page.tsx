'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Share, MoreHorizontal } from 'lucide-react';
import AIEditor from '@/components/editor/AIEditor';
import { useSession } from 'next-auth/react';

export default function EditorPage() {
  const { data: session } = useSession();
  if (session) {
    console.log(session.user?.email);
  } else {
    console.log("session not found");
  }

  const [content, setContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('제목 없는 문서');
  const [isSaving, setIsSaving] = useState(false);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // TODO: Implement auto-save functionality
  };

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement save functionality
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
              placeholder="제목 없는 문서"
            />
            <p className="text-sm text-muted-foreground">
              {isSaving ? '저장 중...' : '2분 전에 저장됨'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? '저장 중...' : '저장'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
          >
            <Share className="w-4 h-4" />
            공유
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="flex-1 flex">
        {/* Main Editor Area */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <AIEditor
              content={content}
              onChange={handleContentChange}
              placeholder="글을 작성하거나 '/'를 입력해 AI 명령어를 사용하세요..."
            />
          </div>
        </div>

        {/* Right Sidebar - AI Tools */}
        <div className="w-80 border-l border-border p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">AI 도구</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors"
                >
                  <div className="font-medium">AI로 작성하기</div>
                  <div className="text-sm text-muted-foreground">프롬프트를 기반으로 콘텐츠를 생성합니다</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors"
                >
                  <div className="font-medium">글 다듬기</div>
                  <div className="text-sm text-muted-foreground">명확성과 문체를 개선합니다</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors"
                >
                  <div className="font-medium">톤 변경</div>
                  <div className="text-sm text-muted-foreground">격식과 감정을 조절합니다</div>
                </motion.button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">빠른 템플릿</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  업무용 이메일
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  감사 인사말
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  사과 메시지
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}