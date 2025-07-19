// Export Supabase client and types
export { supabase } from './client';
export type {
  UserProfile,
  ChatSession,
  ChatMessage,
  ConversationMessage,
  FinancialProfileData,
  SessionData,
  MessageData,
} from './client';

// Export service classes
export { ProfileService } from './profiles';
export { ChatService } from './chat';
