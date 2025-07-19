'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  Send,
  Bot,
  User,
  CheckCircle2,
  Clock,
  FileText,
  Settings,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AnalysisGeneration from '@/components/analysis-generation';
import FinancialAnalysis from '@/components/financial-analysis';

// Add mock responses
const mockResponses = {
  personal: `Great! I'm here to help you create a comprehensive financial profile. We'll start by gathering some personal information. This will help us tailor the financial advice to your specific situation.

Please fill out the following fields:

<user-data>
{
  "step": "personal",
  "fields": {
    "name": "",
    "age": "",
    "location": "",
    "familyStatus": "",
    "dependents": ""
  }
}
</user-data>

<step-data>
{
  "currentStep": "personal",
  "progress": 1,
  "totalSteps": 6,
  "title": "Personal Information",
  "description": "Basic details about you and your family"
}
</step-data>

<user-input>
Please fill out the following fields:
- Name: Alex
- Age: 27
- Location: Quito
- Family Status: Single
- Dependents: 0
</user-input>`,

  income: `Perfect! Now let's talk about your income sources. Understanding your income streams helps us assess your financial capacity and plan accordingly.

<user-data>
{
  "step": "income",
  "fields": {
    "primaryIncome": "",
    "secondaryIncome": "",
    "freelanceIncome": "",
    "investmentIncome": "",
    "otherIncome": ""
  }
}
</user-data>

<step-data>
{
  "currentStep": "incomes",
  "progress": 2,
  "totalSteps": 6,
  "title": "Income Sources",
  "description": "Your salary, business income, and other sources"
}
</step-data>

<user-input>
Please provide details about your income:
- Primary Income (salary): $
- Secondary Income: $
- Freelance/Business Income: $
- Investment Income: $
- Other Income Sources: $
</user-input>`,

  expenses: `Great! Now let's understand your monthly expenses. This helps us calculate your disposable income and identify potential savings opportunities.

<user-data>
{
  "step": "expenses",
  "fields": {
    "housing": "",
    "utilities": "",
    "food": "",
    "transportation": "",
    "insurance": "",
    "entertainment": "",
    "otherExpenses": ""
  }
}
</user-data>

<step-data>
{
  "currentStep": "expenses",
  "progress": 3,
  "totalSteps": 6,
  "title": "Monthly Expenses",
  "description": "Housing, utilities, food, and other monthly costs"
}
</step-data>

<user-input>
Please list your monthly expenses:
- Housing (rent/mortgage): $
- Utilities: $
- Food & Groceries: $
- Transportation: $
- Insurance: $
- Entertainment: $
- Other Expenses: $
</user-input>`,

  debts: `Now let's review your debts and obligations. Understanding your debt situation is crucial for creating an effective financial strategy.

<user-data>
{
  "step": "debts",
  "fields": {
    "creditCards": "",
    "studentLoans": "",
    "mortgage": "",
    "autoLoans": "",
    "personalLoans": "",
    "otherDebts": ""
  }
}
</user-data>

<step-data>
{
  "currentStep": "debts",
  "progress": 4,
  "totalSteps": 6,
  "title": "Debts & Obligations",
  "description": "Credit cards, loans, mortgage, and other debts"
}
</step-data>

<user-input>
Please provide information about your debts:
- Credit Card Debt: $
- Student Loans: $
- Mortgage: $
- Auto Loans: $
- Personal Loans: $
- Other Debts: $
</user-input>`,

  savings: `Excellent! Now let's look at your savings and investments. This helps us understand your current financial position and risk tolerance.

<user-data>
{
  "step": "savings",
  "fields": {
    "emergencyFund": "",
    "savingsAccount": "",
    "checkingAccount": "",
    "investments": "",
    "retirement401k": "",
    "ira": "",
    "otherAssets": ""
  }
}
</user-data>

<step-data>
{
  "currentStep": "savings",
  "progress": 5,
  "totalSteps": 6,
  "title": "Savings & Investments",
  "description": "Emergency fund, retirement accounts, and investments"
}
</step-data>

<user-input>
Please provide details about your savings and investments:
- Emergency Fund: $
- Savings Account: $
- Checking Account: $
- Investment Portfolio: $
- 401(k)/403(b): $
- IRA: $
- Other Assets: $
</user-input>`,

  goals: `Finally, let's discuss your financial goals. These will guide our recommendations and help create a personalized financial plan.

<user-data>
{
  "step": "goals",
  "fields": {
    "shortTermGoals": "",
    "longTermGoals": "",
    "retirementPlans": "",
    "majorPurchases": "",
    "riskTolerance": "",
    "timeHorizon": ""
  }
}
</user-data>

<step-data>
{
  "currentStep": "goals",
  "progress": 6,
  "totalSteps": 6,
  "title": "Financial Goals",
  "description": "Short-term and long-term financial objectives"
}
</step-data>

<user-input>
Please share your financial goals:
- Short-term goals (1-2 years): 
- Long-term goals (5+ years):
- Retirement timeline:
- Major purchases planned:
- Risk tolerance (Conservative/Moderate/Aggressive):
- Investment time horizon:
</user-input>`,
};

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
  onCancel,
}) => {
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
  const [analysisCompletedSteps, setAnalysisCompletedSteps] = useState(0);
  const [hasStartedFinancialReport, setHasStartedFinancialReport] =
    useState(false);
  const [isDevMode, setIsDevMode] = useState(
    process.env.NODE_ENV === 'development'
  );

  console.log('messages', messages);

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
          content: `Sorry, I encountered an error starting the profile collection: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the Mastra backend is running and try again.`,
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

      if (isDevMode) {
        // Use mock response
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API delay
        botResponse = getMockResponse(currentStep);
      } else {
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
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);

      // Extract and process tagged data from the bot response
      const extractedData = parseTaggedData(botResponse);

      // Process extracted data
      if (extractedData.userData) {
        console.log(
          '🎯 Complete profile data received:',
          extractedData.userData
        );
        // Update profile data with the complete user data
        Object.assign(profileData, extractedData.userData);
        // Mark all steps as completed when we receive complete user data
        setSteps((prevSteps) =>
          prevSteps.map((step) => ({ ...step, completed: true }))
        );
        // Set current step to indicate completion
        setCurrentStep('complete');
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
        }
        // Update profile data with step-specific data
        if (extractedData.stepData.data) {
          Object.assign(profileData, extractedData.stepData.data);
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

  // Mock API function for development
  const getMockResponse = (currentStep: string) => {
    const stepMap: Record<string, keyof typeof mockResponses> = {
      personal: 'personal',
      incomes: 'income',
      expenses: 'expenses',
      debts: 'debts',
      savings: 'savings',
      goals: 'goals',
    };

    const responseKey = stepMap[currentStep] || 'personal';
    return mockResponses[responseKey];
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
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Personal Info */}
        {userData.personalInfo && (
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
              Income ({userData.incomes.length})
            </h5>
            <div className='space-y-2'>
              {userData.incomes.map(
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
                      userData.incomes.reduce(
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
              Expenses ({userData.expenses.length})
            </h5>
            <div className='space-y-2'>
              {userData.expenses.map(
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
                      userData.expenses.reduce(
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
              Debts ({userData.debts.length})
            </h5>
            <div className='space-y-2'>
              {userData.debts.map((debt: Record<string, unknown>, index) => (
                <div
                  key={index}
                  className='flex justify-between items-center text-sm'
                >
                  <span className='text-gray-600'>{`${debt.type || ''}`}</span>
                  <span className='font-medium text-gray-900'>
                    {formatCurrency(Number(debt.amount))}
                  </span>
                </div>
              ))}
              <div className='pt-2 mt-2 border-t border-gray-100'>
                <div className='flex justify-between items-center font-semibold text-sm'>
                  <span>Total Debt:</span>
                  <span className='text-orange-600'>
                    {formatCurrency(
                      userData.debts.reduce(
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
              Savings ({userData.savings.length})
            </h5>
            <div className='space-y-2'>
              {userData.savings.map(
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
                      userData.savings.reduce(
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
              Goals ({userData.goals.length})
            </h5>
            <div className='space-y-2'>
              {userData.goals.map((goal: Record<string, unknown>, index) => (
                <div key={index} className='text-sm'>
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <div className='font-medium text-gray-900'>
                        {`${goal.title || ''}`}
                      </div>
                      <div className='text-xs text-gray-500 capitalize'>
                        {`${goal.type || ''}`}
                      </div>
                    </div>
                    {goal.targetAmount && !isNaN(Number(goal.targetAmount)) && (
                      <div className='text-right ml-2'>
                        <div className='font-medium text-gray-900'>
                          {formatCurrency(Number(goal.targetAmount))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

  const handleAnalysisStepComplete = (stepIndex: number) => {
    const completedSteps = stepIndex + 1;
    setAnalysisCompletedSteps(completedSteps);
  };

  const handleAnalysisComplete = () => {
    setIsGeneratingAnalysis(false);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysisPanel(false);
    setIsGeneratingAnalysis(false);
    setAnalysisCompletedSteps(0);
    // Note: We don't reset hasStartedFinancialReport to keep the sidebar permanently hidden
  };

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
              {process.env.NODE_ENV === 'development' && (
                <div className='flex items-center gap-2'>
                  <Settings className='w-4 h-4 text-gray-400' />
                  <Button
                    variant={isDevMode ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setIsDevMode(!isDevMode)}
                    className='text-xs'
                  >
                    {isDevMode ? 'Mock Mode' : 'Live Mode'}
                  </Button>
                </div>
              )}
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
        className={`flex flex-col ${showAnalysisPanel ? 'w-1/4' : 'flex-1'}`}
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
                          <div className='mt-6 flex justify-center'>
                            <Button
                              onClick={() => {
                                setHasStartedFinancialReport(true);
                                setIsGeneratingAnalysis(true);
                                setTimeout(() => {
                                  setShowAnalysisPanel(true);
                                }, 1000);
                              }}
                              className='bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-3 text-lg font-semibold rounded-md shadow-lg hover:shadow-xl transition-all duration-200'
                              size='lg'
                            >
                              Generate Financial Report
                            </Button>
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
                onStepComplete={handleAnalysisStepComplete}
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
        <div className='w-3/4'>
          <FinancialAnalysis
            onClose={handleCloseAnalysis}
            completedSteps={analysisCompletedSteps}
            isStreaming={isGeneratingAnalysis}
          />
        </div>
      )}
    </div>
  );
};

export default FinancialProfileCollection;
