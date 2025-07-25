// Speech Recognition Types and Interfaces

export interface SpeechRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  confidence: number;
  error: string | null;
  hasPermission: boolean | null;
}

export interface SpeechRecognitionActions {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  requestPermission: () => Promise<boolean>;
}

export interface SpeechRecognitionHook extends SpeechRecognitionState, SpeechRecognitionActions {}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  grammars?: SpeechGrammarList;
}

export type SpeechRecognitionErrorType = 
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported'
  | 'permission-denied'
  | 'browser-not-supported';

export interface SpeechRecognitionError {
  type: SpeechRecognitionErrorType;
  message: string;
}

// Korean Voice Commands
export interface VoiceCommand {
  command: string;
  action: string;
  alternatives?: string[];
}

export const KOREAN_VOICE_COMMANDS: VoiceCommand[] = [
  { command: '마침표', action: '.' },
  { command: '쉼표', action: ',' },
  { command: '물음표', action: '?' },
  { command: '느낌표', action: '!' },
  { command: '줄바꿈', action: '\n' },
  { command: '지우기', action: 'delete-word' },
  { command: '모두 지우기', action: 'delete-all' },
  { command: '되돌리기', action: 'undo' },
  { command: '다시하기', action: 'redo' },
  { command: '일시정지', action: 'pause' },
  { command: '계속', action: 'resume' }
];

// Browser Speech Recognition API types extension
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
  
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    grammars: SpeechGrammarList;
    
    start(): void;
    stop(): void;
    abort(): void;
    
    onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  }
  
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    readonly length: number;
    readonly isFinal: boolean;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  
  interface SpeechGrammarList {
    readonly length: number;
    item(index: number): SpeechGrammar;
    addFromURI(src: string, weight?: number): void;
    addFromString(string: string, weight?: number): void;
  }
  
  interface SpeechGrammar {
    src: string;
    weight: number;
  }
}

export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}