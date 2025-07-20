'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  X,
  Download,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface FinancialAnalysisProps {
  onClose: () => void;
  completedSteps?: number;
  isStreaming?: boolean;
}

const mockAnalysisData = {
  portfolioValue: '$125,450',
  monthlyGrowth: '+2.3%',
  riskScore: 6.5,
  recommendations: [
    {
      id: '1',
      title: 'Diversify Technology Holdings',
      description:
        'Your portfolio is heavily weighted in tech stocks (45%). Consider reducing to 25-30%.',
      impact: 'High',
      timeline: '1-2 months',
      status: 'urgent',
    },
    {
      id: '2',
      title: 'Increase Bond Allocation',
      description:
        'Add 15% government bonds to reduce volatility and provide steady income.',
      impact: 'Medium',
      timeline: '2-3 months',
      status: 'recommended',
    },
    {
      id: '3',
      title: 'Emergency Fund Optimization',
      description: 'Your emergency fund is excellent at 8 months of expenses.',
      impact: 'Low',
      timeline: 'Complete',
      status: 'complete',
    },
  ],
  allocation: [
    {
      category: 'Stocks',
      percentage: 65,
      value: '$81,542',
      color: 'bg-blue-500',
    },
    {
      category: 'Bonds',
      percentage: 20,
      value: '$25,090',
      color: 'bg-green-500',
    },
    {
      category: 'Real Estate',
      percentage: 10,
      value: '$12,545',
      color: 'bg-purple-500',
    },
    { category: 'Cash', percentage: 5, value: '$6,273', color: 'bg-gray-500' },
  ],
  projections: {
    oneYear: '$142,000',
    fiveYear: '$198,000',
    tenYear: '$315,000',
  },
};

const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({
  onClose,
  completedSteps = 0,
  isStreaming = false,
}) => {
  const [visibleSections, setVisibleSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const newSections = new Set<string>();

    // Show sections based on completed steps
    if (completedSteps >= 3) newSections.add('overview'); // After "Analyzing Risk Profile"
    if (completedSteps >= 4) newSections.add('allocation'); // After "Evaluating Asset Allocation"
    if (completedSteps >= 5) newSections.add('recommendations'); // After "Generating Recommendations"
    if (completedSteps >= 6) newSections.add('projections'); // After "Calculating Projections"
    if (completedSteps >= 7) newSections.add('actionPlan'); // After "Analysis Complete"

    setVisibleSections(newSections);
  }, [completedSteps]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'urgent':
        return <AlertTriangle size={16} className='text-red-500' />;
      case 'recommended':
        return <Target size={16} className='text-yellow-500' />;
      case 'complete':
        return <CheckCircle size={16} className='text-green-500' />;
      default:
        return <Target size={16} className='text-gray-500' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent':
        return 'border-red-200 bg-red-50';
      case 'recommended':
        return 'border-yellow-200 bg-yellow-50';
      case 'complete':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const StreamingSection: React.FC<{
    children: React.ReactNode;
    sectionKey: string;
    title: string;
    delay?: number;
  }> = ({ children, sectionKey, title, delay = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      if (visibleSections.has(sectionKey)) {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
      }
    }, [visibleSections, sectionKey, delay]);

    if (!visibleSections.has(sectionKey)) {
      return (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold flex items-center gap-2 text-muted-foreground'>
            <Loader2 size={20} className='animate-spin' />
            {title}
          </h3>
          <div className='h-24 bg-muted/30 rounded-lg animate-pulse'></div>
        </div>
      );
    }

    return (
      <div
        className={`transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        {children}
      </div>
    );
  };

  return (
    <div className='h-full bg-background border-l flex flex-col overflow-y-scroll no-scrollbar'>
      {/* Header */}
      <div className='flex items-center justify-between p-6 border-b bg-background'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-10 w-10'>
            <div className='bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full'>
              <BarChart3 size={20} />
            </div>
          </Avatar>
          <div>
            <h2 className='text-xl font-semibold'>Financial Analysis Report</h2>
            <p className='text-sm text-muted-foreground'>
              {isStreaming
                ? 'Generating analysis...'
                : `Generated on ${new Date().toLocaleDateString()}`}
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Download size={16} className='mr-2' />
            Export
          </Button>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 p-6 space-y-6'>
        {/* Portfolio Overview */}
        <StreamingSection sectionKey='overview' title='Portfolio Overview'>
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <PieChart size={20} />
              Portfolio Overview
            </h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='bg-muted rounded-lg p-4'>
                <div className='text-2xl font-bold text-green-600'>
                  {mockAnalysisData.portfolioValue}
                </div>
                <div className='text-sm text-muted-foreground'>Total Value</div>
              </div>
              <div className='bg-muted rounded-lg p-4'>
                <div className='text-2xl font-bold text-blue-600'>
                  {mockAnalysisData.monthlyGrowth}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Monthly Growth
                </div>
              </div>
              <div className='bg-muted rounded-lg p-4'>
                <div className='text-2xl font-bold text-purple-600'>
                  {mockAnalysisData.riskScore}/10
                </div>
                <div className='text-sm text-muted-foreground'>Risk Score</div>
              </div>
            </div>
          </div>
        </StreamingSection>

        {/* Asset Allocation */}
        <StreamingSection
          sectionKey='allocation'
          title='Asset Allocation'
          delay={300}
        >
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <TrendingUp size={20} />
              Asset Allocation
            </h3>
            <div className='space-y-3'>
              {mockAnalysisData.allocation.map((item, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-muted rounded-lg'
                >
                  <div className='flex items-center gap-3'>
                    <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                    <span className='font-medium'>{item.category}</span>
                  </div>
                  <div className='text-right'>
                    <div className='font-semibold'>{item.percentage}%</div>
                    <div className='text-sm text-muted-foreground'>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StreamingSection>

        {/* Recommendations */}
        <StreamingSection
          sectionKey='recommendations'
          title='Key Recommendations'
          delay={600}
        >
          <div className='space-y-4'>
            <Separator />
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <Target size={20} />
              Key Recommendations
            </h3>
            <div className='space-y-3'>
              {mockAnalysisData.recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className={`border rounded-lg p-4 ${getStatusColor(rec.status)}`}
                >
                  <div className='flex items-start gap-3'>
                    <span className='font-semibold text-lg'>{index + 1}</span>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        {getStatusIcon(rec.status)}
                        <h4 className='font-semibold'>{rec.title}</h4>
                        <span className='px-2 py-1 text-xs rounded-full bg-background border'>
                          {rec.impact} Impact
                        </span>
                      </div>
                      <p className='text-sm text-muted-foreground mb-2'>
                        {rec.description}
                      </p>
                      <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                        <div className='flex items-center gap-1'>
                          <Calendar size={12} />
                          {rec.timeline}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </StreamingSection>

        {/* Projections */}
        <StreamingSection
          sectionKey='projections'
          title='Portfolio Projections'
          delay={900}
        >
          <div className='space-y-4'>
            <Separator />
            <h3 className='text-lg font-semibold flex items-center gap-2'>
              <DollarSign size={20} />
              Portfolio Projections
            </h3>
            <div className='grid grid-cols-3 gap-4'>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {mockAnalysisData.projections.oneYear}
                </div>
                <div className='text-sm text-muted-foreground'>1 Year</div>
              </div>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {mockAnalysisData.projections.fiveYear}
                </div>
                <div className='text-sm text-muted-foreground'>5 Years</div>
              </div>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {mockAnalysisData.projections.tenYear}
                </div>
                <div className='text-sm text-muted-foreground'>10 Years</div>
              </div>
            </div>
          </div>
        </StreamingSection>

        {/* Action Plan */}
        <StreamingSection
          sectionKey='actionPlan'
          title='Next Steps'
          delay={1200}
        >
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>Next Steps</h3>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h4 className='font-semibold text-blue-900 mb-2'>
                Immediate Actions (Next 30 days)
              </h4>
              <ul className='space-y-1 text-sm text-blue-800'>
                <li>• Review and rebalance technology stock allocation</li>
                <li>
                  • Research government bond options for portfolio stability
                </li>
                <li>• Schedule quarterly portfolio review meeting</li>
              </ul>
            </div>
          </div>
        </StreamingSection>
      </div>
    </div>
  );
};

export default FinancialAnalysis;
