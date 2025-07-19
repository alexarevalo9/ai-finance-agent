import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Types for our database tables
export interface UserProfile {
  id: string;
  user_id: string; // Supabase auth user ID
  profile_data: FinancialProfileData;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string; // Supabase auth user ID
  user_profile_id: string | null;
  title: string;
  status: 'active' | 'completed' | 'archived';
  current_step: string;
  step_progress: number;
  session_data: SessionData;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  conversation_history: ConversationMessage[];
  last_message_at: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
  message_data?: MessageData;
}

// Types for financial profile data
export interface FinancialProfileData {
  personal?: {
    name?: string;
    age?: string;
    location?: string;
    familyStatus?: string;
    dependents?: string;
  };
  incomes?: {
    primaryIncome?: string;
    secondaryIncome?: string;
    freelanceIncome?: string;
    investmentIncome?: string;
    otherIncome?: string;
  };
  expenses?: {
    housing?: string;
    utilities?: string;
    food?: string;
    transportation?: string;
    insurance?: string;
    entertainment?: string;
    otherExpenses?: string;
  };
  debts?: {
    creditCards?: string;
    studentLoans?: string;
    mortgage?: string;
    autoLoans?: string;
    personalLoans?: string;
    otherDebts?: string;
  };
  savings?: {
    emergencyFund?: string;
    savingsAccount?: string;
    checkingAccount?: string;
    investments?: string;
    retirement401k?: string;
    ira?: string;
    otherAssets?: string;
  };
  goals?: {
    shortTermGoals?: string;
    longTermGoals?: string;
    retirementPlans?: string;
    majorPurchases?: string;
    riskTolerance?: string;
    timeHorizon?: string;
  };
}

export interface SessionData {
  conversationHistory?: Array<{ role: string; content: string }>;
  currentUserInputTemplate?: string;
  extractedTags?: Record<string, unknown>;
}

export interface MessageData {
  userData?: Record<string, unknown>;
  stepData?: Record<string, unknown>;
  userInput?: string;
  extractedTags?: Record<string, unknown>;
}
