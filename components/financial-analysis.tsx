'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  X,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';

interface FinancialAnalysisProps {
  onClose: () => void;
  isStreaming?: boolean;
  reportData?: Record<string, unknown> | null;
}

// Define the expected structure of financial health report data
interface FinancialHealthReport {
  healthScore: {
    overall: string;
    grade: number;
    description: string;
  };
  metrics: {
    debtToIncomeRatio: {
      percentage: number;
      status: string;
      benchmark: string;
    };
    savingsRate: {
      percentage: number;
      status: string;
      benchmark: string;
    };
    emergencyFund: {
      monthsCovered: number;
      status: string;
      recommendation: string;
    };
  };
  breakdown: {
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    totalDebt: number;
    totalSavings: number;
    netWorth: number;
    disposableIncome: number;
    expenseCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  recommendations: Array<{
    id: string;
    priority: string;
    category: string;
    title: string;
    description: string;
    impact: string;
    timeframe: string;
    actionSteps: string[];
  }>;
  projections: {
    oneYear: {
      netWorth: number;
      savings: number;
      debtReduction: number;
    };
    fiveYear: {
      netWorth: number;
      savings: number;
      debtReduction: number;
    };
  };
}

const FinancialAnalysis: React.FC<FinancialAnalysisProps> = ({
  onClose,
  isStreaming = false,
  reportData = null,
}) => {
  // Transform real report data for the component
  const getAnalysisData = () => {
    if (!reportData) {
      return null;
    }

    const healthReport = reportData as unknown as FinancialHealthReport;

    // Calculate monthly growth from projections
    const currentNetWorth = healthReport.breakdown.netWorth;
    const oneYearNetWorth = healthReport.projections.oneYear.netWorth;
    const monthlyGrowthRate =
      currentNetWorth > 0
        ? (((oneYearNetWorth / currentNetWorth) ** (1 / 12) - 1) * 100).toFixed(
            1
          )
        : '0.0';

    // Get expense category colors
    const getExpenseCategoryColor = (category: string) => {
      const colorMap: Record<string, string> = {
        Housing: 'bg-blue-500',
        Food: 'bg-green-500',
        Transportation: 'bg-purple-500',
        Utilities: 'bg-orange-500',
        Entertainment: 'bg-pink-500',
        Others: 'bg-gray-500',
      };
      return colorMap[category] || 'bg-gray-400';
    };

    return {
      portfolioValue: `$${healthReport.breakdown.netWorth.toLocaleString()}`,
      monthlyIncome: `$${healthReport.breakdown.totalMonthlyIncome.toLocaleString()}`,
      monthlyGrowth: `+${monthlyGrowthRate}%`,
      healthGrade: healthReport.healthScore.overall,
      healthScore: healthReport.healthScore.grade,
      healthDescription: healthReport.healthScore.description,

      // Key metrics
      debtToIncomeRatio: healthReport.metrics.debtToIncomeRatio.percentage,
      savingsRate: healthReport.metrics.savingsRate.percentage,
      emergencyFundMonths: healthReport.metrics.emergencyFund.monthsCovered,

      // Financial breakdown
      breakdown: {
        totalMonthlyIncome: healthReport.breakdown.totalMonthlyIncome,
        totalMonthlyExpenses: healthReport.breakdown.totalMonthlyExpenses,
        totalDebt: healthReport.breakdown.totalDebt,
        totalSavings: healthReport.breakdown.totalSavings,
        netWorth: healthReport.breakdown.netWorth,
        disposableIncome: healthReport.breakdown.disposableIncome,
      },

      // Transform expense categories to allocation format
      allocation: healthReport.breakdown.expenseCategories
        .filter((cat) => cat.amount > 0)
        .map((category) => ({
          category: category.category,
          percentage: Math.round(category.percentage * 100) / 100,
          value: `$${category.amount.toLocaleString()}`,
          color: getExpenseCategoryColor(category.category),
        })),

      // Use real recommendations
      recommendations: healthReport.recommendations.map((rec) => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        impact: rec.impact.split(' - ')[0], // Extract impact level
        timeline: rec.timeframe,
        status:
          rec.priority === 'high'
            ? 'urgent'
            : rec.priority === 'medium'
              ? 'recommended'
              : 'complete',
        actionSteps: rec.actionSteps,
      })),

      // Use real projections
      projections: {
        oneYear: `$${healthReport.projections.oneYear.netWorth.toLocaleString()}`,
        fiveYear: `$${healthReport.projections.fiveYear.netWorth.toLocaleString()}`,
        // Add savings projections
        oneYearSavings: `$${healthReport.projections.oneYear.savings.toLocaleString()}`,
        fiveYearSavings: `$${healthReport.projections.fiveYear.savings.toLocaleString()}`,
      },
    };
  };

  const analysisData = getAnalysisData();

  // Debug: log the real report data when available
  if (reportData) {
    console.log('📊 Financial Health Report Data:', reportData);
    console.log('🔄 Transformed Analysis Data:', analysisData);
  }

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

  // Show loading state if no data available
  if (!analysisData) {
    return (
      <div className='h-full bg-background border-l flex flex-col overflow-y-scroll no-scrollbar'>
        <div className='flex items-center justify-between p-6 border-b bg-background'>
          <div className='flex items-center gap-3'>
            <Avatar className='h-10 w-10'>
              <div className='bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full'>
                <BarChart3 size={20} />
              </div>
            </Avatar>
            <div>
              <h2 className='text-xl font-semibold'>
                Financial Analysis Report
              </h2>
              <p className='text-sm text-muted-foreground'>
                Waiting for report data...
              </p>
            </div>
          </div>
          <Button variant='ghost' size='icon' onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
        <div className='flex-1 flex items-center justify-center'>
          <div className='text-center space-y-4'>
            <Loader2
              size={40}
              className='animate-spin mx-auto text-muted-foreground'
            />
            <p className='text-muted-foreground'>
              Generate a financial report to see your analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className='text-xl font-semibold'>Financial Health Report</h2>
            <p className='text-sm text-muted-foreground'>
              {isStreaming
                ? 'Generating analysis...'
                : `Generated on ${new Date().toLocaleDateString()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 p-6 space-y-6'>
        {/* Financial Health Overview */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <PieChart size={20} />
            Financial Health Overview
          </h3>

          {/* Health Score Card */}
          <div className='bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-4'>
            <div className='flex items-center gap-4'>
              <div className='text-center'>
                <div className='text-4xl font-bold text-green-600'>
                  {analysisData.healthGrade}
                </div>
                <div className='text-sm text-muted-foreground'>
                  Health Grade
                </div>
              </div>
              <div className='flex-1'>
                <div className='text-2xl font-bold text-gray-800'>
                  {analysisData.healthScore}/100
                </div>
                <div className='text-sm text-muted-foreground mb-2'>
                  {analysisData.healthDescription}
                </div>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div className='bg-muted rounded-lg p-4'>
              <div className='text-2xl font-bold text-green-600'>
                {analysisData.portfolioValue}
              </div>
              <div className='text-sm text-muted-foreground'>Net Worth</div>
            </div>
            <div className='bg-muted rounded-lg p-4'>
              <div className='text-2xl font-bold text-blue-600'>
                {analysisData.monthlyIncome}
              </div>
              <div className='text-sm text-muted-foreground'>
                Monthly Income
              </div>
            </div>
            <div className='bg-muted rounded-lg p-4'>
              <div className='text-2xl font-bold text-purple-600'>
                {analysisData.monthlyGrowth}
              </div>
              <div className='text-sm text-muted-foreground'>
                Projected Growth
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className='grid grid-cols-3 gap-4 mt-4'>
            <div className='bg-white border rounded-lg p-4'>
              <div className='text-lg font-bold text-gray-800'>
                {analysisData.debtToIncomeRatio}%
              </div>
              <div className='text-sm text-muted-foreground'>
                Debt-to-Income
              </div>
            </div>
            <div className='bg-white border rounded-lg p-4'>
              <div className='text-lg font-bold text-gray-800'>
                {analysisData.savingsRate}%
              </div>
              <div className='text-sm text-muted-foreground'>Savings Rate</div>
            </div>
            <div className='bg-white border rounded-lg p-4'>
              <div className='text-lg font-bold text-gray-800'>
                {analysisData.emergencyFundMonths.toFixed(1)}
              </div>
              <div className='text-sm text-muted-foreground'>
                Emergency Fund (months)
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <TrendingUp size={20} />
            Monthly Expense Breakdown
          </h3>
          <div className='space-y-3'>
            {analysisData.allocation.map((item, index) => (
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

        {/* Recommendations */}
        <div className='space-y-4'>
          <Separator />
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <Target size={20} />
            Key Recommendations
          </h3>
          <div className='space-y-3'>
            {analysisData.recommendations.length > 0 ? (
              analysisData.recommendations.map((rec, index) => (
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
                      <div className='flex items-center gap-4 text-xs text-muted-foreground mb-2'>
                        <div className='flex items-center gap-1'>
                          <Calendar size={12} />
                          {rec.timeline}
                        </div>
                      </div>
                      {rec.actionSteps && rec.actionSteps.length > 0 && (
                        <div className='mt-2'>
                          <div className='text-xs font-medium text-muted-foreground mb-1'>
                            Action Steps:
                          </div>
                          <ul className='text-xs text-muted-foreground space-y-1'>
                            {rec.actionSteps.map((step, stepIndex) => (
                              <li key={stepIndex}>• {step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-8 text-muted-foreground'>
                <CheckCircle
                  size={48}
                  className='mx-auto mb-2 text-green-500'
                />
                <p>Excellent! No immediate recommendations needed.</p>
                <p className='text-sm'>Your financial health is on track.</p>
              </div>
            )}
          </div>
        </div>

        {/* Projections */}
        <div className='space-y-4'>
          <Separator />
          <h3 className='text-lg font-semibold flex items-center gap-2'>
            <DollarSign size={20} />
            Financial Projections
          </h3>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <h4 className='font-medium text-center'>Net Worth Growth</h4>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {analysisData.projections.oneYear}
                </div>
                <div className='text-sm text-muted-foreground'>1 Year</div>
              </div>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {analysisData.projections.fiveYear}
                </div>
                <div className='text-sm text-muted-foreground'>5 Years</div>
              </div>
            </div>
            <div className='space-y-3'>
              <h4 className='font-medium text-center'>Savings Growth</h4>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {analysisData.projections.oneYearSavings}
                </div>
                <div className='text-sm text-muted-foreground'>1 Year</div>
              </div>
              <div className='text-center p-4 bg-muted rounded-lg'>
                <div className='text-lg font-bold'>
                  {analysisData.projections.fiveYearSavings}
                </div>
                <div className='text-sm text-muted-foreground'>5 Years</div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Plan */}
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>Next Steps</h3>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h4 className='font-semibold text-blue-900 mb-2'>
              Immediate Actions (Next 30 days)
            </h4>
            <ul className='space-y-1 text-sm text-blue-800'>
              {analysisData.recommendations.length > 0 ? (
                analysisData.recommendations
                  .filter((rec) => rec.status === 'urgent')
                  .slice(0, 3)
                  .map((rec, index) => <li key={index}>• {rec.title}</li>)
              ) : (
                <>
                  <li>
                    • Continue maintaining your excellent financial habits
                  </li>
                  <li>• Review and rebalance your financial goals quarterly</li>
                  <li>
                    • Consider consulting a financial advisor for investment
                    optimization
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialAnalysis;
