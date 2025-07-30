// 편지 내보내기 관련 타입 정의

export type LetterDesign = 'formal' | 'business' | 'personal' | 'thankyou' | 'invitation';

export interface LetterTemplate {
  id: LetterDesign;
  name: string;
  description: string;
  preview: string;
  category: 'formal' | 'business' | 'personal' | 'special';
}

export interface LetterExportOptions {
  design: LetterDesign;
  content: string;
  title: string;
  recipient?: string;
  sender?: string;
  date?: string;
  userId: string;
}

export interface LetterExportRequest {
  options: LetterExportOptions;
}

export interface LetterExportResponse {
  success: boolean;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    filename: string;
    fileSize: number;
    timestamp: string;
    design: LetterDesign;
  };
}

export const LETTER_DESIGNS: Record<LetterDesign, LetterTemplate> = {
  formal: {
    id: 'formal',
    name: '정식 편지',
    description: '전통적인 한국 공식 서신 형식',
    preview: '격식 있는 전통 편지 양식으로 공식적인 내용에 적합합니다.',
    category: 'formal'
  },
  business: {
    id: 'business',
    name: '비즈니스 편지',
    description: '전문적인 업무용 서신 형식',
    preview: '깔끔하고 전문적인 디자인으로 업무 관련 내용에 최적화되어 있습니다.',
    category: 'business'
  },
  personal: {
    id: 'personal',
    name: '개인 편지',
    description: '친근한 개인적인 편지 형식',
    preview: '따뜻하고 개인적인 분위기의 편지로 가족이나 친구에게 적합합니다.',
    category: 'personal'
  },
  thankyou: {
    id: 'thankyou',
    name: '감사 편지',
    description: '우아한 감사 인사 형식',
    preview: '정중하고 우아한 감사의 마음을 전달하는 특별한 양식입니다.',
    category: 'special'
  },
  invitation: {
    id: 'invitation',
    name: '초대 편지',
    description: '행사 초대용 장식적 형식',
    preview: '특별한 행사나 모임 초대에 어울리는 화려한 디자인입니다.',
    category: 'special'
  }
};