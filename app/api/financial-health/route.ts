/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';

// Import the underlying function directly to avoid Mastra execution context issues
function generateFinancialHealthReport(profile: any) {
  // Calculate totals
  const totalMonthlyIncome = profile.incomes.reduce(
    (sum: number, income: any) => sum + income.amount,
    0
  );
  const totalMonthlyExpenses = profile.expenses.reduce(
    (sum: number, expense: any) => sum + expense.amount,
    0
  );
  const totalDebt = profile.debts.reduce(
    (sum: number, debt: any) => sum + debt.amount,
    0
  );
  const totalSavings = profile.savings.reduce(
    (sum: number, saving: any) => sum + saving.amount,
    0
  );
  const disposableIncome = totalMonthlyIncome - totalMonthlyExpenses;
  const netWorth = totalSavings - totalDebt;

  // Calculate key metrics
  const debtToIncomeRatio =
    totalMonthlyIncome > 0 ? (totalDebt / (totalMonthlyIncome * 12)) * 100 : 0;
  const savingsRate =
    totalMonthlyIncome > 0 ? (disposableIncome / totalMonthlyIncome) * 100 : 0;
  const emergencyFundMonths =
    totalMonthlyExpenses > 0 ? totalSavings / totalMonthlyExpenses : 0;

  // Calculate expense breakdown
  const expenseCategories = profile.expenses.map((expense: any) => ({
    category: expense.category,
    amount: expense.amount,
    percentage:
      totalMonthlyExpenses > 0
        ? (expense.amount / totalMonthlyExpenses) * 100
        : 0,
  }));

  // Generate health score
  let score = 100;
  if (debtToIncomeRatio > 50) score -= 30;
  else if (debtToIncomeRatio > 36) score -= 20;
  else if (debtToIncomeRatio > 25) score -= 10;

  if (savingsRate < 0) score -= 25;
  else if (savingsRate < 10) score -= 20;
  else if (savingsRate < 15) score -= 10;
  else if (savingsRate >= 20) score += 5;

  if (emergencyFundMonths < 1) score -= 25;
  else if (emergencyFundMonths < 3) score -= 15;
  else if (emergencyFundMonths < 6) score -= 5;
  else if (emergencyFundMonths >= 6) score += 5;

  if (netWorth < 0) score -= 15;
  if (disposableIncome < 0) score -= 10;
  else if (disposableIncome > 0) score += 5;

  score = Math.max(0, Math.min(100, score));

  let grade: string;
  let description: string;

  if (score >= 90) {
    grade = 'A';
    description = 'Excellent financial health with strong fundamentals';
  } else if (score >= 80) {
    grade = 'B';
    description = 'Good financial health with room for improvement';
  } else if (score >= 70) {
    grade = 'C';
    description = 'Fair financial health - focus on key areas';
  } else if (score >= 60) {
    grade = 'D';
    description = 'Below average financial health - needs attention';
  } else {
    grade = 'F';
    description = 'Poor financial health - immediate action required';
  }

  // Generate basic recommendations
  const recommendations = [];

  if (emergencyFundMonths < 3) {
    recommendations.push({
      id: 'emergency-fund',
      priority: 'high',
      category: 'savings',
      title: 'Build Emergency Fund',
      description: 'Your emergency fund covers less than 3 months of expenses.',
      impact: 'High - Protects against financial emergencies',
      timeframe: '3-6 months',
      actionSteps: [
        'Open high-yield savings account',
        'Set up automatic transfers',
        'Build to 3-6 months expenses',
      ],
    });
  }

  if (debtToIncomeRatio > 36) {
    recommendations.push({
      id: 'debt-reduction',
      priority: 'high',
      category: 'debt',
      title: 'Reduce Debt Load',
      description: 'Your debt-to-income ratio is above recommended levels.',
      impact: 'High - Improves cash flow',
      timeframe: '6-24 months',
      actionSteps: [
        'List all debts',
        'Use debt avalanche method',
        'Avoid new debt',
      ],
    });
  }

  if (savingsRate < 15) {
    recommendations.push({
      id: 'increase-savings',
      priority: 'medium',
      category: 'savings',
      title: 'Increase Savings Rate',
      description: 'Your savings rate is below the recommended 15-20%.',
      impact: 'Medium - Builds long-term wealth',
      timeframe: '3-12 months',
      actionSteps: ['Track expenses', 'Cut spending', 'Automate savings'],
    });
  }

  return {
    healthScore: {
      overall: grade,
      grade: Math.round(score),
      description,
    },
    metrics: {
      debtToIncomeRatio: {
        percentage: Math.round(debtToIncomeRatio * 100) / 100,
        status:
          debtToIncomeRatio <= 25
            ? 'excellent'
            : debtToIncomeRatio <= 36
              ? 'good'
              : 'poor',
        benchmark: 'Recommended: <36% for total debt',
      },
      savingsRate: {
        percentage: Math.round(savingsRate * 100) / 100,
        status:
          savingsRate >= 20 ? 'excellent' : savingsRate >= 15 ? 'good' : 'poor',
        benchmark: 'Recommended: 20% or higher',
      },
      emergencyFund: {
        monthsCovered: Math.round(emergencyFundMonths * 100) / 100,
        status:
          emergencyFundMonths >= 6
            ? 'excellent'
            : emergencyFundMonths >= 3
              ? 'good'
              : 'poor',
        recommendation:
          emergencyFundMonths < 3 ? 'Build to 3-6 months' : 'Well funded',
      },
    },
    breakdown: {
      totalMonthlyIncome,
      totalMonthlyExpenses,
      totalDebt,
      totalSavings,
      netWorth,
      disposableIncome,
      expenseCategories,
    },
    recommendations,
    projections: {
      oneYear: {
        netWorth: Math.round(netWorth + disposableIncome * 12 * 0.8),
        savings: Math.round(totalSavings + disposableIncome * 12 * 0.8),
        debtReduction: Math.round(
          Math.min(totalDebt, disposableIncome * 12 * 0.2)
        ),
      },
      fiveYear: {
        netWorth: Math.round(netWorth + disposableIncome * 60 * 0.8 * 1.2),
        savings: Math.round(totalSavings + disposableIncome * 60 * 0.8 * 1.2),
        debtReduction: Math.round(totalDebt),
      },
    },
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileData, userId, sessionId } = body;

    // Validate required data
    if (!profileData) {
      return NextResponse.json(
        { error: 'Financial profile data is required' },
        { status: 400 }
      );
    }

    // Validate that profile has minimum required data
    const { personalInfo, incomes, expenses, debts, savings } = profileData;
    if (!personalInfo || !incomes || !expenses || !debts || !savings) {
      return NextResponse.json(
        {
          error:
            'Incomplete financial profile. Must include personal info, incomes, expenses, debts, and savings.',
        },
        { status: 400 }
      );
    }

    console.log('🚀 Generating financial health report...');
    console.log('📊 Profile data:', JSON.stringify(profileData, null, 2));

    // Generate the financial health report directly
    const reportData = generateFinancialHealthReport(profileData);

    console.log('✅ Financial health report generated successfully');
    console.log('📋 Report data:', reportData);

    // Generate a narrative summary based on the results
    const narrative = generateNarrativeSummary(reportData);

    return NextResponse.json({
      success: true,
      report: reportData,
      narrative,
      generatedAt: new Date().toISOString(),
      userId,
      sessionId,
    });
  } catch (error) {
    console.error('❌ Error generating financial health report:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate financial health report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Generate narrative summary from tool results

function generateNarrativeSummary(reportData: any): string {
  const healthScore = reportData.healthScore;
  const metrics = reportData.metrics;
  const breakdown = reportData.breakdown;
  const recommendations = reportData.recommendations;

  return `### Executive Summary

**Financial Health Score**: ${healthScore?.overall} (${healthScore?.grade}/100)
${healthScore?.description}

### Key Metrics Analysis

- **Debt-to-Income Ratio**: ${metrics?.debtToIncomeRatio?.percentage}%
  - Status: ${metrics?.debtToIncomeRatio?.status}
  - ${metrics?.debtToIncomeRatio?.benchmark}

- **Savings Rate**: ${metrics?.savingsRate?.percentage}%
  - Status: ${metrics?.savingsRate?.status}
  - ${metrics?.savingsRate?.benchmark}

- **Emergency Fund**: ${metrics?.emergencyFund?.monthsCovered} months covered
  - Status: ${metrics?.emergencyFund?.status}
  - ${metrics?.emergencyFund?.recommendation}

### Financial Breakdown

- **Monthly Income**: $${breakdown?.totalMonthlyIncome?.toLocaleString()}
- **Monthly Expenses**: $${breakdown?.totalMonthlyExpenses?.toLocaleString()}
- **Total Debt**: $${breakdown?.totalDebt?.toLocaleString()}
- **Total Savings**: $${breakdown?.totalSavings?.toLocaleString()}
- **Net Worth**: $${breakdown?.netWorth?.toLocaleString()}

### Priority Recommendations

// eslint-disable-next-line @typescript-eslint/no-explicit-any
${recommendations
  ?.map(
    (rec: any, index: number) => `
${index + 1}. **${rec.title}** (${rec.priority} priority)
   - ${rec.description}
   - Impact: ${rec.impact}
   - Timeframe: ${rec.timeframe}
   - Action Steps: ${rec.actionSteps?.join(', ')}
`
  )
  .join('')}

### Conclusion

Your financial health analysis has been completed with actionable recommendations to improve your financial wellness.`;
}
