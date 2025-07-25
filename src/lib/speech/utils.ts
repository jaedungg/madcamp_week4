import { 
  SpeechRecognitionConfig, 
  SpeechRecognitionErrorType, 
  KOREAN_VOICE_COMMANDS,
  VoiceCommand 
} from './types';

// Default configuration for Korean speech recognition
export const DEFAULT_SPEECH_CONFIG: SpeechRecognitionConfig = {
  language: 'ko-KR',
  continuous: true,
  interimResults: true,
  maxAlternatives: 1,
};

// Check if browser supports speech recognition
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

// Get speech recognition constructor
export function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null;
  
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

// Convert browser error to our error type
export function mapSpeechRecognitionError(error: string): SpeechRecognitionErrorType {
  switch (error) {
    case 'no-speech':
      return 'no-speech';
    case 'aborted':
      return 'aborted';
    case 'audio-capture':
      return 'audio-capture';
    case 'network':
      return 'network';
    case 'not-allowed':
      return 'not-allowed';
    case 'service-not-allowed':
      return 'service-not-allowed';
    case 'bad-grammar':
      return 'bad-grammar';
    case 'language-not-supported':
      return 'language-not-supported';
    default:
      return 'network';
  }
}

// Get user-friendly error message in Korean
export function getErrorMessage(errorType: SpeechRecognitionErrorType): string {
  switch (errorType) {
    case 'no-speech':
      return '음성이 감지되지 않았습니다. 다시 시도해주세요.';
    case 'aborted':
      return '음성 인식이 중단되었습니다.';
    case 'audio-capture':
      return '마이크에 접근할 수 없습니다. 마이크 연결을 확인해주세요.';
    case 'network':
      return '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
    case 'not-allowed':
    case 'permission-denied':
      return '마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.';
    case 'service-not-allowed':
      return '음성 인식 서비스를 사용할 수 없습니다.';
    case 'bad-grammar':
      return '음성 인식 설정에 오류가 있습니다.';
    case 'language-not-supported':
      return '선택한 언어를 지원하지 않습니다.';
    case 'browser-not-supported':
      return '이 브라우저는 음성 인식을 지원하지 않습니다. Chrome이나 Edge를 사용해주세요.';
    default:
      return '음성 인식 중 오류가 발생했습니다.';
  }
}

// Process Korean voice commands
export function processVoiceCommand(text: string): { 
  isCommand: boolean; 
  action?: string; 
  cleanText: string 
} {
  const trimmedText = text.trim().toLowerCase();
  
  const command = KOREAN_VOICE_COMMANDS.find(cmd => 
    cmd.command === trimmedText || 
    (cmd.alternatives && cmd.alternatives.includes(trimmedText))
  );
  
  if (command) {
    return {
      isCommand: true,
      action: command.action,
      cleanText: ''
    };
  }
  
  return {
    isCommand: false,
    cleanText: text
  };
}

// Clean and format transcript text
export function cleanTranscript(text: string): string {
  return text
    .trim()
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Add proper spacing after punctuation
    .replace(/([.!?])\s*/g, '$1 ')
    // Ensure proper spacing before punctuation where needed
    .replace(/\s+([.!?,:;])/g, '$1');
}

// Check if text ends with a complete sentence
export function isCompleteSentence(text: string): boolean {
  const trimmed = text.trim();
  return /[.!?]$/.test(trimmed);
}

// Request microphone permission
export async function requestMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
    return false;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately as we only need permission
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

// Debounce function for interim results
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format confidence score as percentage
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}