'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Download, 
  FileText, 
  Briefcase, 
  Heart, 
  Gift, 
  PartyPopper,
  User,
  Calendar,
  Loader2
} from 'lucide-react';
import { LetterDesign, LETTER_DESIGNS } from '@/types/letter';
import { cn } from '@/lib/utils';

interface LetterExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  title: string;
  userId: string;
}

const designIcons: Record<LetterDesign, React.ComponentType<{ className?: string }>> = {
  formal: FileText,
  business: Briefcase,
  personal: Heart,
  thankyou: Gift,
  invitation: PartyPopper
};

export default function LetterExportModal({
  isOpen,
  onClose,
  content,
  title,
  userId
}: LetterExportModalProps) {
  const [selectedDesign, setSelectedDesign] = useState<LetterDesign>('formal');
  const [recipient, setRecipient] = useState('');
  const [sender, setSender] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!content.trim() && title === '제목 없는 문서') {
      alert('내보낼 내용이 없습니다. 먼저 문서를 작성해주세요.');
      return;
    }

    setIsExporting(true);

    try {
      const exportData = {
        format: 'letter' as const,
        letterOptions: {
          design: selectedDesign,
          recipient: recipient.trim() || undefined,
          sender: sender.trim() || undefined,
          date: customDate.trim() || undefined
        },
        content,
        title,
        userId
      };

      const response = await fetch('/api/letters/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '편지 내보내기에 실패했습니다.');
      }

      const result = await response.json();

      if (result.success && result.downloadUrl) {
        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.metadata?.filename || 'letter.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 모달 닫기
        onClose();
      } else {
        throw new Error(result.error || '편지 내보내기에 실패했습니다.');
      }
    } catch (error) {
      console.error('편지 내보내기 오류:', error);
      alert(error instanceof Error ? error.message : '편지 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const getDesignPreview = (design: LetterDesign): string => {
    switch (design) {
      case 'formal':
        return '전통적인 한국 공식 서신 형식으로, 정중하고 격식 있는 편지에 적합합니다. 적절한 여백과 전통적인 구성으로 정식 문서의 품격을 나타냅니다.';
      case 'business':
        return '깔끔하고 전문적인 비즈니스 레터헤드 스타일입니다. 업무 관련 내용이나 공식적인 업무 소통에 최적화되어 있습니다.';
      case 'personal':
        return '따뜻하고 친근한 개인 편지 형식입니다. 가족이나 친구에게 보내는 개인적인 소통에 어울리는 부드러운 디자인입니다.';
      case 'thankyou':
        return '우아하고 정중한 감사 편지 형식입니다. 감사의 마음을 전달하는 특별한 순간에 어울리는 장식적인 요소가 포함되어 있습니다.';
      case 'invitation':
        return '특별한 행사나 모임 초대에 어울리는 화려하고 축제적인 디자인입니다. 기념일이나 특별한 이벤트 초대장으로 적합합니다.';
      default:
        return '';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">편지로 내보내기</h2>
                  <p className="text-sm text-gray-500">원하는 편지 디자인을 선택하고 정보를 입력하세요</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-grow overflow-y-auto p-6">
              {/* Design Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">편지 디자인 선택</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(LETTER_DESIGNS).map(([key, template]) => {
                    const design = key as LetterDesign;
                    const Icon = designIcons[design];
                    const isSelected = selectedDesign === design;
                    
                    return (
                      <motion.button
                        key={design}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDesign(design)}
                        className={cn(
                          'p-4 border-2 rounded-xl text-left transition-all',
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        )}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            isSelected ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{template.name}</h4>
                            <p className="text-xs text-gray-500">{template.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {template.description}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Design Preview */}
              <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                <h4 className="font-semibold text-gray-900 mb-2">선택한 디자인 미리보기</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {getDesignPreview(selectedDesign)}
                </p>
              </div>

              {/* Additional Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 정보 (선택사항)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      받는 분
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="예: 김철수 님"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      보내는 분
                    </label>
                    <input
                      type="text"
                      value={sender}
                      onChange={(e) => setSender(e.target.value)}
                      placeholder="예: 홍길동"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    날짜 (기본값: 오늘 날짜)
                  </label>
                  <input
                    type="text"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    placeholder="예: 2024년 1월 15일"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex-shrink-0 flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={isExporting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    내보내는 중...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    편지로 내보내기
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}