'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import FinancialSummary from '@/components/financial-summary';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const mockResponses = [
  "Based on your portfolio analysis, I'd recommend diversifying into technology ETFs to balance your current holdings.",
  'The market is showing positive trends in the renewable energy sector. Consider allocating 15% of your portfolio there.',
  'Your current risk profile suggests a moderate approach. I can help you identify some stable dividend-paying stocks.',
  'Looking at your spending patterns, you could save approximately $200 monthly by optimizing your subscription services.',
  'The bond market is offering attractive yields right now. Would you like me to suggest some specific treasury bonds?',
  'Your emergency fund looks solid. Have you considered maximizing your IRA contributions for this tax year?',
  'Based on current market conditions, it might be wise to rebalance your portfolio. I can create a plan for you.',
  'I notice some redundancy in your investment accounts. Consolidating could reduce fees and improve returns.',
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Hello! I'm your AI Finance Agent. I can help you with investment advice, portfolio analysis, budgeting tips, and financial planning. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [botResponseCount, setBotResponseCount] = useState(1); // Start with 1 due to initial message
  const [showSummary, setShowSummary] = useState(false);
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);
  const [summaryResponseThreshold] = useState(4); // Configurable threshold
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showSummary]);

  const getRandomResponse = () => {
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot response delay
    setTimeout(
      () => {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: getRandomResponse(),
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);

        // Increment bot response count and check if summary should be shown
        const newCount = botResponseCount + 1;
        setBotResponseCount(newCount);

        if (newCount >= summaryResponseThreshold && !showSummary) {
          setTimeout(() => setShowSummary(true), 1000);
        }
      },
      1500 + Math.random() * 1000
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleGenerateAnalysis = () => {
    // Add analysis message from bot
    const analysisMessage: Message = {
      id: Date.now().toString(),
      content:
        'I&apos;ve generated a comprehensive financial analysis based on our conversation. The analysis shows 3 high-priority recommendations for portfolio optimization, potential savings of $2,400 annually, and a suggested rebalancing strategy. Would you like me to create a detailed action plan?',
      sender: 'bot',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, analysisMessage]);
    setShowSummary(false);
    setBotResponseCount((prev) => prev + 1);
  };

  return (
    <div className='flex flex-col h-full max-w-4xl mx-auto bg-background'>
      {/* Header */}
      <div className='flex items-center gap-3 p-4 border-b bg-muted/50'>
        <Avatar className='h-8 w-8'>
          <div className='bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full'>
            <Bot size={16} />
          </div>
        </Avatar>
        <div>
          <h3 className='font-semibold text-sm'>AI Finance Agent</h3>
          <p className='text-xs text-muted-foreground'>
            Your personal financial assistant
          </p>
        </div>
        <div className='ml-auto'>
          <div className='h-2 w-2 bg-green-500 rounded-full animate-pulse'></div>
        </div>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-8 min-h-0'>
        {messages.map((message) => (
          <div key={message.id} className='flex gap-3 justify-start'>
            <Avatar className='h-8 w-8 mt-1'>
              <div
                className={`${message.sender === 'bot' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'} flex items-center justify-center h-full w-full rounded-full`}
              >
                {message.sender === 'bot' ? (
                  <Bot size={16} />
                ) : (
                  <User size={16} />
                )}
              </div>
            </Avatar>

            <div className='flex flex-col max-w-[80%] items-start'>
              <div className='rounded-2xl px-4 py-2 text-sm bg-muted'>
                {message.content}
              </div>
              <span className='text-xs text-muted-foreground mt-1 px-2'>
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className='flex gap-3 justify-start'>
            <Avatar className='h-8 w-8 mt-1'>
              <div className='bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full'>
                <Bot size={16} />
              </div>
            </Avatar>
            <div className='flex flex-col max-w-[80%] items-start'>
              <div className='rounded-2xl px-4 py-3 bg-muted'>
                <div className='flex space-x-1'>
                  <div className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'></div>
                  <div
                    className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className='w-2 h-2 bg-muted-foreground rounded-full animate-bounce'
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Summary */}
        {showSummary && (
          <FinancialSummary
            isCollapsed={summaryCollapsed}
            onToggleCollapse={() => setSummaryCollapsed(!summaryCollapsed)}
            onGenerateAnalysis={handleGenerateAnalysis}
            onContinueConversation={() => setShowSummary(false)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!showSummary && (
        <div className='p-4'>
          <div className='flex gap-2'>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Ask me anything about your finances...'
              className='flex-1'
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              size='icon'
            >
              <Send size={16} />
            </Button>
          </div>
          <p className='text-xs text-muted-foreground mt-2 text-center'>
            Press Enter to send • AI can make mistakes, verify important
            information
          </p>
        </div>
      )}
    </div>
  );
};

export default Chat;
