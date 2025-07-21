'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Send, Bot, User, CheckCircle2, Clock, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnalysisGeneration from '@/components/analysis-generation';
import FinancialAnalysis from '@/components/financial-analysis';
import {
  ChatService,
  ProfileService,
  FinancialRecordsService,
} from '@/lib/supabase';
import { useAuth } from '@/lib/auth/context';
import { useParams } from 'next/navigation';
import FinancialRecordsUpload from '@/components/financial-records-upload';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ProfileStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

interface FinancialProfileCollectionProps {
  onComplete: (profileData: Record<string, unknown>) => void;
  onCancel: () => void;
  sessionId?: string; // Optional sessionId prop
}

// Types for extracted data
interface ExtractedMessageData {
  userData?: Record<string, unknown>;
  stepData?: {
    step: string;
    data: Record<string, unknown>;
  };
  userInput?: string;
  cleanedContent: string;
}

const PROFILE_STEPS: ProfileStep[] = [
  {
    id: 'personal-info',
    name: 'Personal Information',
    description: 'Basic details about you and your family',
    completed: false,
  },
  {
    id: 'incomes',
    name: 'Income Sources',
    description: 'Your salary, business income, and other sources',
    completed: false,
  },
  {
    id: 'expenses',
    name: 'Monthly Expenses',
    description: 'Housing, utilities, food, and other monthly costs',
    completed: false,
  },
  {
    id: 'debts',
    name: 'Debts & Obligations',
    description: 'Credit cards, loans, mortgage, and other debts',
    completed: false,
  },
  {
    id: 'savings',
    name: 'Savings & Investments',
    description: 'Emergency fund, retirement accounts, and investments',
    completed: false,
  },
  {
    id: 'goals',
    name: 'Financial Goals',
    description: 'Short-term and long-term financial objectives',
    completed: false,
  },
];

// Utility functions to extract and parse JSON data from messages
const extractTagContent = (content: string, tagName: string): string | null => {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
};

const parseTaggedData = (content: string): ExtractedMessageData => {
  const extractedData: ExtractedMessageData = {
    cleanedContent: content,
  };

  try {
    // Extract user-data
    const userDataContent = extractTagContent(content, 'user-data');
    if (userDataContent) {
      try {
        extractedData.userData = JSON.parse(userDataContent);
        console.log('📊 Extracted User Data:', extractedData.userData);
      } catch (error) {
        console.error('Error parsing user-data JSON:', error);
      }
    }

    // Extract step-data
    const stepDataContent = extractTagContent(content, 'step-data');
    if (stepDataContent) {
      try {
        extractedData.stepData = JSON.parse(stepDataContent);
        console.log('📈 Extracted Step Data:', extractedData.stepData);
      } catch (error) {
        console.error('Error parsing step-data JSON:', error);
      }
    }

    // Extract user-input (this is plain text, not JSON)
    const userInputContent = extractTagContent(content, 'user-input');
    if (userInputContent) {
      extractedData.userInput = userInputContent;
      console.log('💬 Extracted User Input Template:', extractedData.userInput);
    }

    // Remove all tags from the content for display
    extractedData.cleanedContent = content
      .replace(/<user-data>[\s\S]*?<\/user-data>/gi, '')
      .replace(/<step-data>[\s\S]*?<\/step-data>/gi, '')
      .replace(/<user-input>[\s\S]*?<\/user-input>/gi, '')
      .trim();
  } catch (error) {
    console.error('Error extracting tagged data:', error);
    extractedData.cleanedContent = content;
  }

  return extractedData;
};

const FinancialProfileCollection: React.FC<FinancialProfileCollectionProps> = ({
  onComplete,
  // onCancel, // Currently unused - can be implemented later
  sessionId: propSessionId,
}) => {
  const { user } = useAuth();
  const params = useParams();
  const routeSessionId = params.sessionId as string;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState('personal-info');
  const [steps, setSteps] = useState<ProfileStep[]>(PROFILE_STEPS);
  const [profileData] = useState<Record<string, unknown>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [currentUserInputTemplate, setCurrentUserInputTemplate] =
    useState<string>('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [hasStartedFinancialReport, setHasStartedFinancialReport] =
    useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRecords, setParsedRecords] = useState<Record<string, unknown>[]>(
    []
  );
  const [isUploadingRecords, setIsUploadingRecords] = useState(false);
  const [financialHealthReport, setFinancialHealthReport] = useState<Record<
    string,
    unknown
  > | null>(null);

  // Use the sessionId from props or route params
  const actualSessionId = propSessionId || routeSessionId;

  console.log('messages', messages);

  // Save chat message to conversation history
  const saveChatMessage = async (
    content: string,
    role: 'user' | 'bot',
    messageData: Record<string, unknown> = {}
  ) => {
    if (!actualSessionId || !user) return;

    try {
      await ChatService.addMessage(actualSessionId, role, content, messageData);
    } catch (error) {
      console.error(
        'Error saving chat message to conversation history:',
        error
      );
    }
  };

  // Update profile data in database
  const updateProfileData = async (newData: Record<string, unknown>) => {
    if (!user) return;

    try {
      await ProfileService.updateUserProfile(newData);
    } catch (error) {
      console.error('Error updating profile data:', error);
    }
  };

  // Update session progress in database
  const updateSessionProgress = async (
    step: string,
    progress: number,
    sessionData: Record<string, unknown> = {}
  ) => {
    if (!actualSessionId) return;

    try {
      await ChatService.updateSessionProgress(actualSessionId, step, progress);

      // Also update session data if provided
      if (Object.keys(sessionData).length > 0) {
        await ChatService.updateChatSession(actualSessionId, {
          session_data: sessionData,
        });
      }
    } catch (error) {
      console.error('Error updating session progress:', error);
    }
  };

  // Handle file upload and record parsing
  const handleFileRecordsParsed = (records: Record<string, unknown>[]) => {
    setParsedRecords(records);
    console.log('📊 Parsed financial records:', records.length, 'records');
  };

  const handleFileSelected = (file: File | null) => {
    setUploadedFile(file);
  };

  // Upload financial records to database and storage
  const uploadFinancialRecords = async (): Promise<boolean> => {
    if (
      !user ||
      !actualSessionId ||
      !uploadedFile ||
      parsedRecords.length === 0
    ) {
      return false;
    }

    setIsUploadingRecords(true);

    try {
      // Generate proper UUID for batch ID
      const batchId = crypto.randomUUID
        ? crypto.randomUUID()
        : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c == 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          });

      // Upload file to storage
      const fileUrl = await FinancialRecordsService.uploadFile(
        uploadedFile,
        user.id
      );

      if (!fileUrl) {
        throw new Error('Failed to upload file to storage');
      }

      // Prepare records for database
      const recordsToInsert = parsedRecords.map((record) => ({
        user_id: user.id,
        chat_session_id: actualSessionId,
        amount: Number(record.amount),
        type: String(record.type) as 'expense' | 'income',
        record_date: String(record.record_date),
        category: String(record.category),
        description: record.description
          ? String(record.description)
          : undefined,
        account: record.account ? String(record.account) : undefined,
        currency: 'USD',
        payment_type: record.payment_type
          ? String(record.payment_type)
          : undefined,
        note: record.note ? String(record.note) : undefined,
        labels: record.labels
          ? Array.isArray(record.labels)
            ? record.labels.map(String)
            : [String(record.labels)]
          : undefined,
        is_transfer: Boolean(record.is_transfer || false),
        source_file_name: uploadedFile.name,
        source_file_url: fileUrl,
      }));

      // Insert records to database
      const insertedRecords = await FinancialRecordsService.insertRecords(
        recordsToInsert,
        batchId
      );

      console.log(
        '✅ Successfully uploaded financial records:',
        insertedRecords.length,
        'records'
      );

      return true;
    } catch (error) {
      console.error('❌ Error uploading financial records:', error);
      return false;
    } finally {
      setIsUploadingRecords(false);
    }
  };

  // Load existing conversation history
  const loadConversationHistory = async (): Promise<boolean> => {
    if (!actualSessionId || !user) return false;

    try {
      const conversationHistory =
        await ChatService.getConversationHistory(actualSessionId);

      if (conversationHistory.length > 0) {
        // Convert conversation history to display messages
        const displayMessages: Message[] = conversationHistory.map(
          (msg, index) => ({
            id: `${index}`,
            content: msg.content,
            sender: msg.role,
            timestamp: new Date(msg.timestamp),
          })
        );

        setMessages(displayMessages);

        // Set conversation history for state management
        const historyForState = conversationHistory.map((msg) => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        }));
        setConversationHistory(historyForState);

        console.log(
          '📚 Loaded conversation history:',
          conversationHistory.length,
          'messages'
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading conversation history:', error);
      return false;
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!isInitialized) {
      initializeProfileCollection();
    }
  }, [isInitialized]);

  console.log('messages', messages);

  // TODO: change to use clerk id or other id nad check where to use this
  const profileSessionId = `fp-${'user-' + Date.now()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log('profileSessionId', profileSessionId);
  const initializeProfileCollection = async () => {
    setIsTyping(true);

    // First, try to load existing conversation history
    const hasExistingConversation = await loadConversationHistory();

    // If we have existing conversation, skip new initialization
    if (hasExistingConversation) {
      setIsInitialized(true);
      setIsTyping(false);
      return;
    }

    try {
      const response = await fetch('/api/financial-profile/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // TODO: change to use clerk id
          sessionId: profileSessionId,
          step: 'personal-info',
          currentData: {},
          conversationHistory: [
            {
              role: 'user',
              content:
                'I want to create my financial profile and get started with the collection process.',
            },
          ],
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Check if response has content before parsing JSON
      const text = await response.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.sessionId) {
        setSessionId(data.sessionId);

        // Process the initial bot response for templates and data
        const initialBotMessage =
          data.message || "Hello! Let's start building your financial profile.";
        const extractedData = parseTaggedData(initialBotMessage);

        // Process extracted data from initial response
        if (extractedData.userData) {
          console.log('🎯 Initial user data received:', extractedData.userData);
          Object.assign(profileData, extractedData.userData);
        }

        if (extractedData.stepData) {
          console.log('🔄 Initial step data received:', extractedData.stepData);
          if (
            extractedData.stepData.step &&
            extractedData.stepData.step !== currentStep
          ) {
            setCurrentStep(extractedData.stepData.step);
          }
          if (extractedData.stepData.data) {
            Object.assign(profileData, extractedData.stepData.data);
          }
        }

        if (extractedData.userInput) {
          console.log(
            '📝 Initial user input template:',
            extractedData.userInput
          );
          setCurrentUserInputTemplate(extractedData.userInput);
          setInputValue(extractedData.userInput);
        }

        setMessages([
          {
            id: '1',
            content: initialBotMessage, // Keep original message with tags for display
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);

        // Set initial conversation history with cleaned content
        setConversationHistory([
          {
            role: 'user',
            content:
              'I want to create my financial profile and get started with the collection process.',
          },
          {
            role: 'assistant',
            content: extractedData.cleanedContent,
          },
        ]);
        setIsInitialized(true);
      } else {
        throw new Error('No session ID received from server');
      }
    } catch (error) {
      console.error('Error initializing financial profile:', error);
      setMessages([
        {
          id: 'error',
          content: `Sorry, I encountered an error starting the profile collection: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the backend services are running and try again.`,
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
      setIsInitialized(true); // Set to true so user can still cancel
    } finally {
      setIsTyping(false);
    }
  };

  const updateStepCompletion = (stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !sessionId) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Save user message to database
    await saveChatMessage(inputValue, 'user');

    // Update conversation history
    const newConversationHistory = [
      ...conversationHistory,
      { role: 'user', content: inputValue },
    ];
    setConversationHistory(newConversationHistory);

    setInputValue('');
    setIsTyping(true);

    // Clear template after sending message
    if (currentUserInputTemplate) {
      setCurrentUserInputTemplate('');
    }

    try {
      let botResponse = '';

      const response = await fetch('/api/financial-profile/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          step: currentStep,
          currentData: profileData,
          conversationHistory: newConversationHistory,
        }),
      });

      const data = await response.json();
      botResponse = data.message;

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Extract and process tagged data from the bot response
      const extractedData = parseTaggedData(botResponse);

      // Save bot message to database with extracted data
      await saveChatMessage(botResponse, 'bot', {
        userData: extractedData.userData,
        stepData: extractedData.stepData,
        userInput: extractedData.userInput,
        extractedTags: {
          hasUserData: !!extractedData.userData,
          hasStepData: !!extractedData.stepData,
          hasUserInput: !!extractedData.userInput,
        },
      });

      // Process extracted data
      if (extractedData.userData) {
        console.log(
          '🎯 Complete profile data received:',
          extractedData.userData
        );
        // Update profile data with the complete user data
        Object.assign(profileData, extractedData.userData);

        // Save complete profile data to database
        await updateProfileData(extractedData.userData);

        // Mark all steps as completed when we receive complete user data
        setSteps((prevSteps) =>
          prevSteps.map((step) => ({ ...step, completed: true }))
        );
        // Set current step to indicate completion
        setCurrentStep('complete');

        // Update session as completed
        await updateSessionProgress('complete', 100, {
          conversationHistory,
          profileData: extractedData.userData,
          completedAt: new Date().toISOString(),
        });

        // Call onComplete callback with the collected profile data
        onComplete(extractedData.userData);
      }

      if (extractedData.stepData) {
        console.log('🔄 Step data received:', extractedData.stepData);
        // Update current step based on agent response
        if (
          extractedData.stepData.step &&
          extractedData.stepData.step !== currentStep
        ) {
          // Mark the previous step as completed when moving to a new step
          updateStepCompletion(currentStep);
          setCurrentStep(extractedData.stepData.step);

          // Calculate progress (assuming 6 steps total)
          const stepData = extractedData.stepData as {
            progress?: number;
            step?: string;
            [key: string]: unknown;
          };
          const stepProgress = Math.round((stepData.progress || 1) * (100 / 6));

          // Update session progress in database
          await updateSessionProgress(
            extractedData.stepData.step,
            stepProgress,
            {
              conversationHistory,
              currentUserInputTemplate,
              extractedTags: { stepData: extractedData.stepData },
            }
          );
        }
        // Update profile data with step-specific data
        if (extractedData.stepData.data) {
          Object.assign(profileData, extractedData.stepData.data);
          // Save incremental profile data to database
          await updateProfileData(extractedData.stepData.data);
        }
      } else {
        // Fallback: If no step data is provided, try to infer step progression
        // based on the content of the message
        const messageContent = extractedData.cleanedContent.toLowerCase();

        // Simple heuristics to detect step progression when step-data is missing
        if (
          messageContent.includes('income') &&
          currentStep === 'personal-info'
        ) {
          updateStepCompletion(currentStep);
          setCurrentStep('incomes');
        } else if (
          messageContent.includes('expense') &&
          currentStep === 'incomes'
        ) {
          updateStepCompletion(currentStep);
          setCurrentStep('expenses');
        } else if (
          messageContent.includes('debt') &&
          currentStep === 'expenses'
        ) {
          updateStepCompletion(currentStep);
          setCurrentStep('debts');
        } else if (
          messageContent.includes('saving') &&
          currentStep === 'debts'
        ) {
          updateStepCompletion(currentStep);
          setCurrentStep('savings');
        } else if (
          messageContent.includes('goal') &&
          currentStep === 'savings'
        ) {
          updateStepCompletion(currentStep);
          setCurrentStep('goals');
        }
      }

      if (extractedData.userInput) {
        console.log('📝 User input template:', extractedData.userInput);
        // Set the template as the input value for easy filling
        setCurrentUserInputTemplate(extractedData.userInput);
        setInputValue(extractedData.userInput);
      }

      // Update conversation history with cleaned bot response (without tags)
      setConversationHistory([
        ...newConversationHistory,
        { role: 'assistant', content: extractedData.cleanedContent },
      ]);

      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    // Shift+Enter allows new lines
  };

  // Compact summary component for completed profile
  const renderCompactSummary = (userData: Record<string, unknown>) => {
    const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

    return (
      <div className='grid grid-cols-2 gap-4'>
        {/* Personal Info */}
        {userData.personalInfo && typeof userData.personalInfo === 'object' && (
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h5 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <User className='w-4 h-4 text-blue-600' />
              Personal Info
            </h5>
            <div className='space-y-1 text-sm'>
              {Object.entries(
                userData.personalInfo as Record<string, unknown>
              ).map(([key, value]) => (
                <div key={key} className='flex justify-between'>
                  <span className='text-gray-600 capitalize'>
                    {key.replace(/([A-Z])/g, ' $1')}:
                  </span>
                  <span className='font-medium text-gray-900'>
                    {`${value || ''}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Income Summary */}
        {userData.incomes && Array.isArray(userData.incomes) && (
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h5 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-green-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 6v12m-3-2.818l.621.621L12 15l2.379 1.803L15.621 15.621L12 15l-2.379-1.803L9.621 16.621 12 15l2.379 1.803.621-.621L12 15l-2.379-1.803z'
                />
              </svg>
              Income ({(userData.incomes as Record<string, unknown>[]).length})
            </h5>
            <div className='space-y-2'>
              {(userData.incomes as Record<string, unknown>[]).map(
                (income: Record<string, unknown>, index) => (
                  <div key={index} className='text-sm'>
                    <div className='flex justify-between items-center'>
                      <span className='text-gray-600'>
                        {`${income.source || ''}`}
                      </span>
                      <div className='text-right'>
                        <div className='font-medium text-gray-900'>
                          {formatCurrency(Number(income.amount))}
                        </div>
                        <div className='text-xs text-gray-500'>
                          {`${income.frequency || ''}`}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
              <div className='pt-2 mt-2 border-t border-gray-100'>
                <div className='flex justify-between items-center font-semibold text-sm'>
                  <span>Total Monthly:</span>
                  <span className='text-green-600'>
                    {formatCurrency(
                      (userData.incomes as Record<string, unknown>[]).reduce(
                        (sum: number, income: Record<string, unknown>) =>
                          sum + (Number(income.amount) || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Expenses Summary */}
        {userData.expenses && Array.isArray(userData.expenses) && (
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h5 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-red-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20 12H4'
                />
              </svg>
              Expenses (
              {(userData.expenses as Record<string, unknown>[]).length})
            </h5>
            <div className='space-y-2'>
              {(userData.expenses as Record<string, unknown>[]).map(
                (expense: Record<string, unknown>, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center text-sm'
                  >
                    <span className='text-gray-600'>
                      {`${expense.category || ''}`}
                    </span>
                    <span className='font-medium text-gray-900'>
                      {formatCurrency(Number(expense.amount))}
                    </span>
                  </div>
                )
              )}
              <div className='pt-2 mt-2 border-t border-gray-100'>
                <div className='flex justify-between items-center font-semibold text-sm'>
                  <span>Total Monthly:</span>
                  <span className='text-red-600'>
                    {formatCurrency(
                      (userData.expenses as Record<string, unknown>[]).reduce(
                        (sum: number, expense: Record<string, unknown>) =>
                          sum + (Number(expense.amount) || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debts Summary */}
        {userData.debts && Array.isArray(userData.debts) && (
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h5 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-orange-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
              Debts ({(userData.debts as Record<string, unknown>[]).length})
            </h5>
            <div className='space-y-2'>
              {(userData.debts as Record<string, unknown>[]).map(
                (debt: Record<string, unknown>, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center text-sm'
                  >
                    <span className='text-gray-600'>{`${debt.type || ''}`}</span>
                    <span className='font-medium text-gray-900'>
                      {formatCurrency(Number(debt.amount))}
                    </span>
                  </div>
                )
              )}
              <div className='pt-2 mt-2 border-t border-gray-100'>
                <div className='flex justify-between items-center font-semibold text-sm'>
                  <span>Total Debt:</span>
                  <span className='text-orange-600'>
                    {formatCurrency(
                      (userData.debts as Record<string, unknown>[]).reduce(
                        (sum: number, debt: Record<string, unknown>) =>
                          sum + (Number(debt.amount) || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Savings Summary */}
        {userData.savings && Array.isArray(userData.savings) && (
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h5 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-blue-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
              Savings ({(userData.savings as Record<string, unknown>[]).length})
            </h5>
            <div className='space-y-2'>
              {(userData.savings as Record<string, unknown>[]).map(
                (saving: Record<string, unknown>, index) => (
                  <div
                    key={index}
                    className='flex justify-between items-center text-sm'
                  >
                    <span className='text-gray-600'>
                      {`${saving.type || ''}`}
                    </span>
                    <span className='font-medium text-gray-900'>
                      {formatCurrency(Number(saving.amount))}
                    </span>
                  </div>
                )
              )}
              <div className='pt-2 mt-2 border-t border-gray-100'>
                <div className='flex justify-between items-center font-semibold text-sm'>
                  <span>Total Savings:</span>
                  <span className='text-blue-600'>
                    {formatCurrency(
                      (userData.savings as Record<string, unknown>[]).reduce(
                        (sum: number, saving: Record<string, unknown>) =>
                          sum + (Number(saving.amount) || 0),
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Summary */}
        {userData.goals && Array.isArray(userData.goals) && (
          <div className='bg-white rounded-lg p-4 border border-gray-200'>
            <h5 className='font-semibold text-gray-900 mb-3 flex items-center gap-2'>
              <svg
                className='w-4 h-4 text-purple-600'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z'
                />
              </svg>
              Goals ({(userData.goals as Record<string, unknown>[]).length})
            </h5>
            <div className='space-y-2'>
              {(userData.goals as Record<string, unknown>[]).map(
                (goal: Record<string, unknown>, index) => (
                  <div key={index} className='text-sm'>
                    <div className='flex justify-between items-start'>
                      <div className='flex-1'>
                        <div className='font-medium text-gray-900'>
                          {String(goal.title || '')}
                        </div>
                        <div className='text-xs text-gray-500 capitalize'>
                          {String(goal.type || '')}
                        </div>
                      </div>
                      {goal.targetAmount &&
                        !isNaN(Number(goal.targetAmount)) && (
                          <div className='text-right ml-2'>
                            <div className='font-medium text-gray-900'>
                              {formatCurrency(Number(goal.targetAmount))}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAnalysisComplete = () => {
    setIsGeneratingAnalysis(false);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysisPanel(false);
    setIsGeneratingAnalysis(false);
    // Note: We don't reset hasStartedFinancialReport to keep the sidebar permanently hidden
  };

  // onCancel functionality can be added later when needed

  return (
    <div className='flex h-full bg-background'>
      {/* Progress Sidebar - Hide when financial report has been started */}
      {!hasStartedFinancialReport && (
        <div className='w-80 bg-gray-50 border-r p-6 overflow-y-auto'>
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-2'>
              <h2 className='text-xl font-semibold text-gray-900'>
                Financial Profile Setup
              </h2>
            </div>
            <p className='text-sm text-gray-600'>
              Let&apos;s build your comprehensive financial profile step by
              step.
            </p>
          </div>

          <div className='space-y-4'>
            {steps.map((step) => {
              const isActive =
                step.id === currentStep && currentStep !== 'complete';
              const isCompleted = step.completed;

              return (
                <div
                  key={step.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : isCompleted
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className='flex items-start gap-3'>
                    <div className='flex-shrink-0 mt-1'>
                      {isCompleted ? (
                        <CheckCircle2 className='w-5 h-5 text-green-600' />
                      ) : isActive ? (
                        <Clock className='w-5 h-5 text-blue-600' />
                      ) : (
                        <div className='w-5 h-5 rounded-full border-2 border-gray-300' />
                      )}
                    </div>
                    <div className='flex-1'>
                      <h3
                        className={`font-medium ${
                          isActive
                            ? 'text-blue-900'
                            : isCompleted
                              ? 'text-green-900'
                              : 'text-gray-700'
                        }`}
                      >
                        {step.name}
                      </h3>
                      <p
                        className={`text-sm mt-1 ${
                          isActive
                            ? 'text-blue-700'
                            : isCompleted
                              ? 'text-green-700'
                              : 'text-gray-500'
                        }`}
                      >
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className='mt-8 p-4 bg-blue-50 rounded-lg'>
            <div className='flex items-center gap-2 mb-2'>
              <FileText className='w-4 h-4 text-blue-600' />
              <span className='text-sm font-medium text-blue-900'>
                Progress: {steps.filter((s) => s.completed).length}/
                {steps.length}
              </span>
            </div>
            <div className='w-full bg-blue-200 rounded-full h-2'>
              <div
                className='bg-blue-600 h-2 rounded-full transition-all'
                style={{
                  width: `${(steps.filter((s) => s.completed).length / steps.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <div
        className={`flex flex-col ${showAnalysisPanel ? 'w-2/6' : 'flex-1'}`}
      >
        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-6'>
          <div className='max-w-4xl mx-auto space-y-6'>
            {messages.map((message) => {
              const parsedData = parseTaggedData(message.content);
              const isBotMessage = message.sender === 'bot';
              const isUserData = parsedData.userData !== undefined;

              return (
                <div key={message.id} className='flex gap-4 justify-start'>
                  <Avatar className='w-8 h-8 flex-shrink-0'>
                    <div className='w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                      {message.sender === 'bot' ? (
                        <Bot className='w-4 h-4 text-white' />
                      ) : (
                        <User className='w-4 h-4 text-white' />
                      )}
                    </div>
                  </Avatar>
                  <div className='flex-1 space-y-2'>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium text-sm text-gray-900'>
                        {message.sender === 'bot' ? 'Financial Advisor' : 'You'}
                      </span>
                      <span className='text-xs text-gray-500'>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div className='prose prose-sm max-w-none'>
                      {isBotMessage ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            // Custom styling for markdown elements
                            h1: ({ children }) => (
                              <h1 className='text-xl font-bold text-gray-900 mb-3 mt-4'>
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className='text-lg font-semibold text-gray-900 mb-2 mt-3'>
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className='text-base font-semibold text-gray-900 mb-2 mt-3'>
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className='text-gray-700 mb-2 leading-relaxed'>
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className='font-semibold text-gray-900'>
                                {children}
                              </strong>
                            ),
                            ul: ({ children }) => (
                              <ul className='list-disc ml-4 mb-2 space-y-1'>
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className='list-decimal ml-4 mb-2 space-y-1'>
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className='text-gray-700'>{children}</li>
                            ),
                            code: ({ children }) => (
                              <code className='bg-gray-100 px-1 py-0.5 rounded text-sm font-mono'>
                                {children}
                              </code>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className='border-l-4 border-blue-500 pl-4 italic text-gray-600 my-2'>
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {parsedData.cleanedContent}
                        </ReactMarkdown>
                      ) : (
                        <p className='text-gray-700 whitespace-pre-wrap'>
                          {message.content}
                        </p>
                      )}

                      {isUserData && parsedData.userData && (
                        <div className='mt-4 p-6 bg-green-50 border border-green-200 rounded-lg'>
                          <h4 className='font-semibold mb-4 text-green-900 flex items-center gap-2'>
                            <CheckCircle2 className='w-5 h-5' />
                            Complete Financial Profile Summary
                          </h4>
                          {renderCompactSummary(parsedData.userData)}
                          <div className='mt-6 space-y-6'>
                            {/* File Upload Section */}
                            <div className='bg-blue-50 border border-blue-200 rounded-lg p-6'>
                              <FinancialRecordsUpload
                                onRecordsParsed={handleFileRecordsParsed}
                                onFileSelected={handleFileSelected}
                                disabled={isUploadingRecords}
                              />
                            </div>

                            {/* Generate Report Button */}
                            <div className='flex justify-center'>
                              <Button
                                onClick={async () => {
                                  // First upload financial records if any
                                  if (parsedRecords.length > 0) {
                                    const uploadSuccess =
                                      await uploadFinancialRecords();
                                    if (uploadSuccess) {
                                      console.log(
                                        '✅ Financial records uploaded successfully'
                                      );
                                    } else {
                                      console.error(
                                        '❌ Failed to upload financial records'
                                      );
                                      return; // Don't proceed with report generation
                                    }
                                  }

                                  try {
                                    // Generate the financial health report using the new API
                                    setHasStartedFinancialReport(true);
                                    setIsGeneratingAnalysis(true);

                                    const response = await fetch(
                                      '/api/financial-health',
                                      {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          profileData: parsedData.userData,
                                          userId: user?.id,
                                          sessionId: actualSessionId,
                                        }),
                                      }
                                    );

                                    const result = await response.json();
                                    console.log('📊 API Response:', result);

                                    if (result.success) {
                                      if (result.report) {
                                        setFinancialHealthReport(result.report);
                                        console.log(
                                          '✅ Financial health report generated:',
                                          result.report
                                        );
                                      } else {
                                        console.log(
                                          '⚠️ API succeeded but no structured report data available. Using narrative only.',
                                          'Narrative length:',
                                          result.narrative?.length || 0
                                        );
                                        // Still proceed with the analysis panel even if we only have narrative
                                      }
                                    } else {
                                      console.error(
                                        '❌ Failed to generate financial health report:',
                                        result.error || 'Unknown error'
                                      );
                                    }

                                    setTimeout(() => {
                                      setShowAnalysisPanel(true);
                                    }, 1000);
                                  } catch (error) {
                                    console.error(
                                      '❌ Error generating financial health report:',
                                      error
                                    );
                                    setIsGeneratingAnalysis(false);
                                  }
                                }}
                                disabled={isUploadingRecords}
                                className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-lg font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50'
                                size='lg'
                              >
                                {isUploadingRecords ? (
                                  <div className='flex items-center gap-2'>
                                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                                    <span>Uploading Records...</span>
                                  </div>
                                ) : (
                                  'Generate Financial Report'
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className='flex gap-4 justify-start'>
                <Avatar className='w-8 h-8 flex-shrink-0'>
                  <div className='w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center'>
                    <Bot className='w-4 h-4 text-white' />
                  </div>
                </Avatar>
                <div className='flex-1 space-y-2'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-sm text-gray-900'>
                      Financial Advisor
                    </span>
                    <span className='text-xs text-gray-500'>typing...</span>
                  </div>
                  <div className='flex gap-1'>
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]' />
                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]' />
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Generation - Show during and after generation */}
            {hasStartedFinancialReport && (
              <AnalysisGeneration
                onComplete={handleAnalysisComplete}
                onStepComplete={() => {}}
                isCompleted={!isGeneratingAnalysis}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className='border-t bg-white p-6'>
          <div className='max-w-4xl mx-auto'>
            <div className='flex gap-4'>
              <div className='flex-1'>
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    currentUserInputTemplate
                      ? 'Fill out the template...'
                      : 'Type your response here...'
                  }
                  disabled={isTyping || !isInitialized || isGeneratingAnalysis}
                  className='w-full min-h-[40px] max-h-[300px] resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                  rows={Math.max(
                    1,
                    Math.min(10, (inputValue.match(/\n/g) || []).length + 1)
                  )}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() ||
                  isTyping ||
                  !isInitialized ||
                  isGeneratingAnalysis
                }
                size='default'
                className='self-end'
              >
                <Send className='w-4 h-4' />
              </Button>
            </div>
            <p className='text-xs text-gray-500 mt-2'>
              Press Enter + Shift for new line • Press Enter to send • Your
              financial information is kept secure and private
            </p>
          </div>
        </div>
      </div>

      {/* Financial Analysis Panel - Show when analysis is requested */}
      {showAnalysisPanel && (
        <div className='w-4/6 min-w-0'>
          <FinancialAnalysis
            onClose={handleCloseAnalysis}
            isStreaming={isGeneratingAnalysis}
            reportData={financialHealthReport}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialProfileCollection;
