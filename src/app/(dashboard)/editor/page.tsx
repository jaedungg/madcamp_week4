'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Share, MoreHorizontal, Loader2 } from 'lucide-react';
import AIEditor from '@/components/editor/AIEditor';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import {
  generateText,
  improveText,
  changeTone,
  getSelectedText,
  insertOrReplaceText
} from '@/lib/ai/services';
import { Editor } from '@tiptap/core';
import { transformDocument } from '@/lib/transform';

export default function EditorPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  if (session) {
    console.log(session.user?.email);
  } else {
    console.log("session not found");
  }

  const [content, setContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('제목 없는 문서');
  const [isSaving, setIsSaving] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiLoadingType, setAiLoadingType] = useState<string>('');
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave();
  };

  // 자동 저장 트리거 (debounce 적용)
  const triggerAutoSave = () => {
    // 기존 타이머가 있으면 취소
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // 3초 후 자동 저장 실행
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (session?.user?.email && (content || documentTitle !== '제목 없는 문서')) {
        handleAutoSave();
      }
    }, 3000);
  };

  // 자동 저장 함수 (수동 저장과 분리)
  const handleAutoSave = async () => {
    if (!session?.user?.email || isSaving) return;

    try {
      const saveData = {
        title: documentTitle || '제목 없는 문서',
        content: content || '',
        category: 'draft',
        tags: [],
        user_id: session.user.email
      };

      let response;
      if (documentId) {
        // 기존 문서 업데이트
        response = await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData),
        });
      } else {
        // 새 문서 생성
        response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData),
        });
      }

      if (response.ok) {
        const savedDocument = await response.json();

        if (!documentId && savedDocument.id) {
          setDocumentId(savedDocument.id);
        }

        setLastSaved(new Date());
        console.log('자동 저장 완료:', savedDocument);
      }
    } catch (error) {
      console.error('자동 저장 오류:', error);
      // 자동 저장 실패 시 사용자에게 알리지 않음 (덜 방해되게)
    }
  };

  // 시간 경과 표시 함수
  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  // 문서 제목 변경 핸들러
  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    triggerAutoSave();
  };

  // 문서 불러오기 함수
  const loadDocument = async (docId: string) => {
    if (!session?.user?.email) return;

    try {
      console.log('문서 로드 시작:', { docId, userEmail: session.user.email });

      // URL 파라미터 제거 - API에서 세션 정보 사용
      const response = await fetch(`/api/documents/${docId}`);

      console.log('API 응답 상태:', response.status, response.ok);

      if (!response.ok) {
        throw new Error('문서를 불러올 수 없습니다.');
      }

      const data = await response.json();
      console.log('API 응답 데이터:', data);

      if (!data.success) {
        throw new Error(data.error || '문서를 불러올 수 없습니다.');
      }

      // API 응답을 camelCase로 변환 
      const document = transformDocument(data.document);
      console.log('변환된 문서 데이터:', document);
      console.log('문서 내용 길이:', document.content?.length || 0);

      setDocumentId(document.id);
      setDocumentTitle(document.title || '제목 없는 문서');
      setContent(document.content || '');
      setLastSaved(new Date(document.updatedAt || document.createdAt));

      // 문서 접근 로그 기록
      if (session?.user?.id) {
        try {
          await fetch(`/api/documents/${docId}/access`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: session.user.id,
              time_spent: 0, // 로드 시점에는 0
            }),
          });
        } catch (logError) {
          console.warn('문서 접근 로그 기록 실패:', logError);
          // 로그 실패는 사용자 경험을 방해하지 않음
        }
      }

      console.log('문서 불러오기 완료:', document);
    } catch (error) {
      console.error('문서 불러오기 오류:', error);
      alert(error instanceof Error ? error.message : '문서를 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 페이지 로드 시 URL에서 문서 ID 확인 및 문서 불러오기
  useEffect(() => {
    const docId = searchParams.get('id');
    console.log('useEffect 실행:', { docId, hasSession: !!session?.user?.email, userEmail: session?.user?.email });
    if (docId && session?.user?.email) {
      loadDocument(docId);
    }
  }, [searchParams, session]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const handleSave = async () => {
    if (!session?.user?.email) {
      alert('로그인이 필요합니다.');
      return;
    }

    setIsSaving(true);
    try {
      const saveData = {
        title: documentTitle || '제목 없는 문서',
        content: content || '',
        category: 'draft',
        tags: [],
        user_id: session.user.email
      };

      let response;
      if (documentId) {
        // 기존 문서 업데이트
        response = await fetch(`/api/documents/${documentId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData),
        });
      } else {
        // 새 문서 생성
        response = await fetch('/api/documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '문서 저장에 실패했습니다.');
      }

      const savedDocument = await response.json();

      if (!documentId && savedDocument.id) {
        setDocumentId(savedDocument.id);
      }

      setLastSaved(new Date());
      console.log('문서가 성공적으로 저장되었습니다:', savedDocument);

    } catch (error) {
      console.error('문서 저장 오류:', error);
      alert(error instanceof Error ? error.message : '문서 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // AI 텍스트 생성 기능
  const handleAIGenerate = async () => {
    if (!editorRef.current) return;

    const prompt = window.prompt('어떤 내용을 작성하고 싶으신가요?\n(예: "회사 팀워크의 중요성에 대한 글")');
    if (!prompt || prompt.trim().length === 0) return;

    try {
      setIsAILoading(true);
      setAiLoadingType('generate');

      const result = await generateText({
        prompt: prompt.trim(),
        type: 'business-email',
        tone: 'professional',
        length: 'medium'
      });

      if (result.success && result.content) {
        insertOrReplaceText(editorRef.current, result.content);
      } else {
        alert(result.error || '내용 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('AI 생성 오류:', error);
      alert('AI 생성 중 오류가 발생했습니다.');
    } finally {
      setIsAILoading(false);
      setAiLoadingType('');
    }
  };

  // 글 다듬기 기능
  const handleAIImprove = async () => {
    if (!editorRef.current) return;

    const selectedText = getSelectedText(editorRef.current);
    if (!selectedText || selectedText.trim().length === 0) {
      alert('개선할 텍스트를 선택하거나 작성해주세요.');
      return;
    }

    try {
      setIsAILoading(true);
      setAiLoadingType('improve');

      const result = await improveText({
        text: selectedText,
        improvements: ['문법 개선', '자연스러운 표현', '명확성 개선'],
        tone: 'professional'
      });

      if (result.success && result.content) {
        insertOrReplaceText(editorRef.current, result.content, true);
      } else {
        alert(result.error || '텍스트 개선에 실패했습니다.');
      }
    } catch (error) {
      console.error('글 다듬기 오류:', error);
      alert('글 다듬기 중 오류가 발생했습니다.');
    } finally {
      setIsAILoading(false);
      setAiLoadingType('');
    }
  };

  // 톤 변경 기능
  const handleAIToneChange = async () => {
    if (!editorRef.current) return;

    const selectedText = getSelectedText(editorRef.current);
    if (!selectedText || selectedText.trim().length === 0) {
      alert('톤을 변경할 텍스트를 선택하거나 작성해주세요.');
      return;
    }

    const targetTone = window.prompt('어떤 톤으로 변경하시겠습니까?\n(formal, professional, friendly, casual 중 선택)', 'friendly');
    if (!targetTone) return;

    try {
      setIsAILoading(true);
      setAiLoadingType('tone');

      const result = await changeTone({
        text: selectedText,
        currentTone: 'formal',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        targetTone: targetTone as any
      });

      if (result.success && result.content) {
        insertOrReplaceText(editorRef.current, result.content, true);
      } else {
        alert(result.error || '톤 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('톤 변경 오류:', error);
      alert('톤 변경 중 오류가 발생했습니다.');
    } finally {
      setIsAILoading(false);
      setAiLoadingType('');
    }
  };

  // 템플릿 삽입 기능
  const handleTemplateSelect = (templateType: string) => {
    if (!editorRef.current) return;

    const templates: Record<string, string> = {
      'business-email': `<h3>제목: [메일 제목을 입력하세요]</h3><p>[받는 분 성함] 님,</p><p>안녕하세요. 평소 업무에 수고가 많으시겠습니다.</p><p>이번에 [업무 내용/요청 사항]에 대해 연락드립니다...</p><p>감사합니다.<br>[보내는 이 성명]</p>`,
      'thank-you': `<p>[성함]님께,</p><p>지난번 [구체적인 도움 내용]에 대해 진심으로 감사드립니다.</p><p>덕분에 [결과/도움이 된 점]할 수 있었고, 정말 큰 힘이 되었습니다...</p><p>다시 한번 감사드리며,<br>[성명]</p>`,
      'apology-message': `<p>[성함]님께,</p><p>먼저 [사건/상황]에 대해 진심으로 사과드립니다.</p><p>제가 [잘못한 점/부족했던 부분]으로 인해 불편을 끼쳐드려 죄송합니다...</p><p>앞으로는 이런 일이 없도록 더욱 신경 쓰겠습니다.<br>죄송합니다.<br><br>[성명]</p>`
    };

    const content = templates[templateType];
    if (content) {
      insertOrReplaceText(editorRef.current, content);
    }
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
              onChange={(e) => handleTitleChange(e.target.value)}
              className="text-lg font-semibold text-foreground bg-transparent border-none outline-none focus:ring-0 p-0"
              placeholder="제목 없는 문서"
            />
            <p className="text-sm text-muted-foreground">
              {isSaving
                ? '저장 중...'
                : lastSaved
                  ? `${getTimeAgo(lastSaved)}에 저장됨`
                  : '저장되지 않음'
              }
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
              key={documentId || 'new-document'}
              content={content}
              onChange={handleContentChange}
              placeholder="글을 작성하거나 '/'를 입력해 AI 명령어를 사용하세요..."
              onEditorReady={(editor) => {
                editorRef.current = editor;
              }}
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
                  onClick={handleAIGenerate}
                  disabled={isAILoading}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">AI로 작성하기</div>
                    {isAILoading && aiLoadingType === 'generate' && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">프롬프트를 기반으로 콘텐츠를 생성합니다</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={handleAIImprove}
                  disabled={isAILoading}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">글 다듬기</div>
                    {isAILoading && aiLoadingType === 'improve' && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">명확성과 문체를 개선합니다</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={handleAIToneChange}
                  disabled={isAILoading}
                  className="w-full p-3 text-left bg-card hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-2">
                    <div className="font-medium">톤 변경</div>
                    {isAILoading && aiLoadingType === 'tone' && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">격식과 감정을 조절합니다</div>
                </motion.button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">빠른 템플릿</h3>
              <div className="space-y-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleTemplateSelect('business-email')}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  업무용 이메일
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleTemplateSelect('thank-you')}
                  className="w-full p-2 text-left text-sm bg-muted hover:bg-accent rounded-lg transition-colors"
                >
                  감사 인사말
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleTemplateSelect('apology-message')}
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