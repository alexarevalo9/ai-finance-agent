// Export Supabase client and types
export { supabase } from './client';
export type {
  UserProfile,
  ChatSession,
  ChatMessage,
  ConversationMessage,
  FinancialRecord,
  FinancialProfileData,
  SessionData,
  MessageData,
} from './client';

// Export service classes
export { ProfileService } from './profiles';
export { ChatService } from './chat';
export { FinancialRecordsService } from './financial-records';
