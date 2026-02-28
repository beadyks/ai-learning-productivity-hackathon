/**
 * Message and conversation type definitions
 * Covers chat messages, conversation context, and interaction modes
 */

export type MessageType = 'text' | 'voice' | 'system';
export type InteractionMode = 'tutor' | 'interviewer' | 'mentor';

export interface ContentSource {
  documentId: string;
  documentName: string;
  pageNumber?: number;
  relevanceScore: number;
}

export interface MessageMetadata {
  sources?: ContentSource[];
  confidence?: number;
  cached?: boolean;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  mode: InteractionMode;
  timestamp: Date;
  sender: 'user' | 'assistant';
  metadata?: MessageMetadata;
}

export interface ConversationContext {
  currentTopic?: string;
  recentQueries: string[];
  relevantDocuments: string[];
}

export interface SessionState {
  sessionId: string;
  mode: InteractionMode;
  messages: Message[];
  isTyping: boolean;
  context: ConversationContext;
}

export interface SessionActions {
  addMessage: (message: Message) => void;
  setMode: (mode: InteractionMode) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
  updateContext: (context: Partial<ConversationContext>) => void;
}
