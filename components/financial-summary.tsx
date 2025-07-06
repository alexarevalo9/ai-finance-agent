'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  ChevronUp,
  ChevronDown,
  Bot,
} from 'lucide-react';

interface DiscussionTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  priority: 'high' | 'medium' | 'low';
}

interface FinancialSummaryProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onGenerateAnalysis: () => void;
  onContinueConversation: () => void;
}

const mockTopics: DiscussionTopic[] = [
  {
    id: '1',
    title: 'Portfolio Diversification',
    description: 'Technology ETFs and sector allocation strategies',
    icon: <PieChart size={16} />,
    priority: 'high',
  },
  {
    id: '2',
    title: 'Investment Opportunities',
    description: 'Renewable energy, bonds, and dividend stocks',
    icon: <TrendingUp size={16} />,
    priority: 'high',
  },
  {
    id: '3',
    title: 'Cost Optimization',
    description: 'Subscription services and account consolidation',
    icon: <DollarSign size={16} />,
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Tax Planning',
    description: 'IRA contributions and year-end strategies',
    icon: <BarChart3 size={16} />,
    priority: 'medium',
  },
];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'medium':
      return 'border-yellow-200 bg-yellow-50 text-yellow-700';
    case 'low':
      return 'border-green-200 bg-green-50 text-green-700';
    default:
      return 'border-gray-200 bg-gray-50 text-gray-700';
  }
};

const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  isCollapsed,
  onToggleCollapse,
  onGenerateAnalysis,
  onContinueConversation,
}) => {
  return (
    <div className='flex gap-3 justify-start'>
      <Avatar className='h-8 w-8 mt-1'>
        <div className='bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full'>
          <Bot size={16} />
        </div>
      </Avatar>
      <div className='flex flex-col max-w-[80%] items-start'>
        <div className='border rounded-xl p-6 bg-background shadow-sm w-full'>
          <div className='flex items-center justify-between mb-4'>
            <div>
              <h3 className='font-semibold text-lg'>
                Financial Discussion Summary
              </h3>
              <p className='text-sm text-muted-foreground'>
                Key topics we&apos;ve covered in our conversation
              </p>
            </div>
            <Button variant='ghost' size='icon' onClick={onToggleCollapse}>
              {isCollapsed ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronUp size={16} />
              )}
            </Button>
          </div>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            }`}
          >
            <div className='space-y-3 mb-6'>
              <h4 className='font-medium text-sm text-muted-foreground'>
                TOPICS DISCUSSED ({mockTopics.length})
              </h4>
              <div className='grid gap-3'>
                {mockTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    className={`border rounded-lg p-4 ${getPriorityColor(topic.priority)}`}
                  >
                    <div className='flex items-start gap-3'>
                      <span className='font-semibold text-lg'>{index + 1}</span>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          {topic.icon}
                          <h5 className='font-medium text-sm'>{topic.title}</h5>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(topic.priority)}`}
                          >
                            {topic.priority}
                          </span>
                        </div>
                        <p className='text-sm opacity-80'>
                          {topic.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3'>
              <Button
                onClick={onGenerateAnalysis}
                className='flex-1 bg-primary hover:bg-primary/90'
                size='lg'
              >
                Generate Financial Analysis
              </Button>
              <Button
                variant='outline'
                onClick={onContinueConversation}
                size='lg'
              >
                Continue Conversation
              </Button>
            </div>

            <p className='text-xs text-muted-foreground mt-3 text-center'>
              Analysis includes portfolio recommendations, risk assessment, and
              action plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;
