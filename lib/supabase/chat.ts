import { supabase } from './client';
import type {
  ChatSession,
  ChatMessage,
  SessionData,
  MessageData,
} from './client';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  /**
   * Create a new chat session for current user
   */
  static async createChatSession(
    userProfileId?: string,
    title = 'Financial Profile Session',
    sessionId?: string
  ): Promise<ChatSession | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const sessionData = {
        user_id: user.id,
        user_profile_id: userProfileId || null,
        title,
        status: 'active' as const,
        current_step: 'personal',
        step_progress: 0,
        session_data: {},
        ...(sessionId && { id: sessionId }), // Include specific ID if provided
      };

      const { data, error } = await supabase
        .from('chat_sessions')
        .insert(sessionData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat session:', error);
      return null;
    }
  }

  /**
   * Get chat session by ID (automatically filtered by current user via RLS)
   */
  static async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching chat session:', error);
      return null;
    }
  }

  /**
   * Get all chat sessions for current user
   */
  static async getUserChatSessions(): Promise<ChatSession[]> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user chat sessions:', error);
      return [];
    }
  }

  /**
   * Update chat session
   */
  static async updateChatSession(
    sessionId: string,
    updates: Partial<{
      title: string;
      status: 'active' | 'completed' | 'archived';
      current_step: string;
      step_progress: number;
      session_data: SessionData;
    }>
  ): Promise<ChatSession | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating chat session:', error);
      return null;
    }
  }

  /**
   * Add message to chat session
   */
  static async addMessage(
    sessionId: string,
    sender: 'user' | 'bot',
    content: string,
    messageData: MessageData = {}
  ): Promise<ChatMessage | null> {
    try {
      // Get the current message count to set the order
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_session_id', sessionId);

      const messageOrder = (count || 0) + 1;

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          chat_session_id: sessionId,
          sender,
          content,
          message_data: messageData,
          message_order: messageOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }

  /**
   * Get all messages for a chat session (automatically filtered by RLS)
   */
  static async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('message_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  }

  /**
   * Get latest messages for a chat session (with limit)
   */
  static async getLatestMessages(
    sessionId: string,
    limit = 50
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_session_id', sessionId)
        .order('message_order', { ascending: false })
        .limit(limit);

      if (error) throw error;
      // Reverse to get chronological order
      return (data || []).reverse();
    } catch (error) {
      console.error('Error fetching latest messages:', error);
      return [];
    }
  }

  /**
   * Update session step and progress
   */
  static async updateSessionProgress(
    sessionId: string,
    currentStep: string,
    stepProgress: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          current_step: currentStep,
          step_progress: stepProgress,
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating session progress:', error);
      return false;
    }
  }

  /**
   * Mark session as completed
   */
  static async markSessionCompleted(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_sessions')
        .update({
          status: 'completed',
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking session as completed:', error);
      return false;
    }
  }

  /**
   * Delete chat session and all its messages
   */
  static async deleteChatSession(sessionId: string): Promise<boolean> {
    try {
      // Messages will be automatically deleted due to CASCADE constraint
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat session:', error);
      return false;
    }
  }

  /**
   * Generate a new chat session ID
   */
  static generateSessionId(): string {
    return uuidv4();
  }
}
