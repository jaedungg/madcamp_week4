import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, Download, Check } from 'lucide-react';
import { Document } from '@/types/document';
import { useSession } from 'next-auth/react';
 
interface ExportModalProps {
  documents: Document[];
  showExportModal: boolean;
  setShowExportModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const ExportModal: React.FC<ExportModalProps> = ({ documents, showExportModal, setShowExportModal } : ExportModalProps) => {
  const { data: session } = useSession();
  
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectDocument = (documentId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc.id));
    }
    setSelectAll(!selectAll);
  };

  const handleExportSelectedDocuments = async () => {
    console.log('Exporting documents:', selectedDocuments, 'as', exportFormat);
    if (!session?.user?.email || selectedDocuments.length === 0) return;

    try {
      const res = await fetch('/api/documents/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user?.id,
          documentIds: selectedDocuments,
          format: exportFormat,
          includeContent: true
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || '내보내기 실패');

      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = `documents-export.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setShowExportModal(false);
      setSelectedDocuments([]);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : '파일 내보내기 실패');
    }
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', description: '구조화된 데이터 형식' },
    { value: 'csv', label: 'CSV', description: '표 형식 데이터' },
    { value: 'pdf', label: 'PDF', description: '문서 형식으로 내보내기' }
  ];

  if (!showExportModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden"
      >
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">문서 내보내기</h2>
              </div>
            </div>
            <button
              onClick={() => setShowExportModal(false)}
              className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* 문서 선택 섹션 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">문서 선택</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1"
              >
                {selectAll ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div 
            className="space-y-2 max-h-[280px] scrollbar-hide overflow-y-auto overflow-hidden">
              {documents.map((doc) => {
                const isSelected = selectedDocuments.includes(doc.id);
                return (
                  <motion.label
                    key={doc.id}
                    whileHover={{ scale: 1.00 }}
                    whileTap={{ scale: 0.99 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectDocument(doc.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-500' 
                          : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{doc.title}</div>
                        {/* <div className="text-xs text-gray-500">{doc.size}</div> */}
                      </div>
                    </div>
                  </motion.label>
                );
              })}
            </div>

            {selectedDocuments.length > 0 && (
              <div className="mt-3.5 p-2 px-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-500">
                  <span className="font-semibold">{selectedDocuments.length}개</span>의 문서가 선택되었습니다
                </p>
              </div>
            )}
          </div>

          {/* 파일 형식 선택 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">내보내기 형식</h3>
            <div className="grid grid-cols-3 gap-2">
              {formatOptions.map((option) => (
                <label
                  key={option.value}
                  // className={`flex items-center gap-3 p-2 rounded-xl border-2 cursor-pointer transition-all ${
                  className={`flex items-center gap-3 p-2 px-3 rounded-xl border-2 cursor-pointer transition-all ${
                    exportFormat === option.value
                      ? 'border-blue-200 bg-blue-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="relative">
                    <input
                      type="radio"
                      name="format"
                      value={option.value}
                      checked={exportFormat === option.value}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      exportFormat === option.value
                        ? 'border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {exportFormat === option.value && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{option.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => setShowExportModal(false)}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
            >
              취소
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportSelectedDocuments}
              disabled={selectedDocuments.length === 0}
              className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                selectedDocuments.length > 0
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              내보내기
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ExportModal;