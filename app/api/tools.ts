import { tool } from 'ai';
import { z } from 'zod';

const FinancialProfileInputSchema = z.object({
  personalInfo: z.object({
    name: z.string(),
    age: z.number(),
    location: z.string(),
    familyStatus: z.string(),
  }),
  incomes: z.array(
    z.object({
      source: z.string(),
      amount: z.number(),
      frequency: z.string(),
    })
  ),
  expenses: z.array(
    z.object({
      category: z.string(),
      amount: z.number(),
    })
  ),
  debts: z.array(
    z.object({
      type: z.string(),
      amount: z.number(),
    })
  ),
  savings: z.array(
    z.object({
      type: z.string(),
      amount: z.number(),
    })
  ),
  goals: z.array(
    z.object({
      title: z.string(),
      type: z.string(),
    })
  ),
});

// Output schema for financial health report
export const FinancialHealthReportSchema = z.object({
  healthScore: z.object({
    overall: z.string(), // A, B, C, D, F
    grade: z.number(), // 0-100
    description: z.string(),
  }),
  metrics: z.object({
    debtToIncomeRatio: z.object({
      percentage: z.number(),
      status: z.string(), // excellent, good, fair, poor
      benchmark: z.string(),
    }),
    savingsRate: z.object({
      percentage: z.number(),
      status: z.string(),
      benchmark: z.string(),
    }),
    emergencyFund: z.object({
      monthsCovered: z.number(),
      status: z.string(),
      recommendation: z.string(),
    }),
    debtLoad: z.object({
      totalDebt: z.number(),
      creditUtilization: z.number().optional(),
      status: z.string(),
    }),
  }),
  breakdown: z.object({
    totalMonthlyIncome: z.number(),
    totalMonthlyExpenses: z.number(),
    totalDebt: z.number(),
    totalSavings: z.number(),
    netWorth: z.number(),
    disposableIncome: z.number(),
    expenseCategories: z.array(
      z.object({
        category: z.string(),
        amount: z.number(),
        percentage: z.number(),
      })
    ),
  }),
  recommendations: z.array(
    z.object({
      id: z.string(),
      priority: z.string(), // high, medium, low
      category: z.string(), // debt, savings, expenses, income
      title: z.string(),
      description: z.string(),
      impact: z.string(),
      timeframe: z.string(),
      actionSteps: z.array(z.string()),
    })
  ),
  projections: z.object({
    oneYear: z.object({
      netWorth: z.number(),
      savings: z.number(),
      debtReduction: z.number(),
    }),
    fiveYear: z.object({
      netWorth: z.number(),
      savings: z.number(),
      debtReduction: z.number(),
    }),
  }),
  generatedAt: z.string(),
});

export const generateFinancialHealthTool = tool({
  description:
    'Analyze financial profile and generate comprehensive health report with metrics, recommendations, and projections',
  parameters: z.object({
    profile: FinancialProfileInputSchema,
  }),
  execute: async ({ profile }) => {
    return generateFinancialHealthReport(profile);
  },
});

export function generateFinancialHealthReport(
  profile: z.infer<typeof FinancialProfileInputSchema>
) {
  // Calculate totals
  const totalMonthlyIncome = profile.incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );
  const totalMonthlyExpenses = profile.expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const totalDebt = profile.debts.reduce((sum, debt) => sum + debt.amount, 0);
  const totalSavings = profile.savings.reduce(
    (sum, saving) => sum + saving.amount,
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
  const expenseCategories = profile.expenses.map((expense) => ({
    category: expense.category,
    amount: expense.amount,
    percentage:
      totalMonthlyExpenses > 0
        ? (expense.amount / totalMonthlyExpenses) * 100
        : 0,
  }));

  // Generate health score
  const healthScore = calculateHealthScore({
    debtToIncomeRatio,
    savingsRate,
    emergencyFundMonths,
    netWorth,
    disposableIncome,
  });

  // Generate recommendations
  const recommendations = generateRecommendations({
    debtToIncomeRatio,
    savingsRate,
    emergencyFundMonths,
    totalDebt,
    disposableIncome,
    expenseCategories,
    profile,
  });

  // Calculate projections
  const projections = calculateProjections({
    currentSavings: totalSavings,
    currentDebt: totalDebt,
    monthlyIncome: totalMonthlyIncome,
    savingsRate: Math.max(0, savingsRate),
  });

  return {
    healthScore,
    metrics: {
      debtToIncomeRatio: {
        percentage: Math.round(debtToIncomeRatio * 100) / 100,
        status: getDebtToIncomeStatus(debtToIncomeRatio),
        benchmark: 'Recommended: <36% for total debt, <28% for housing',
      },
      savingsRate: {
        percentage: Math.round(savingsRate * 100) / 100,
        status: getSavingsRateStatus(savingsRate),
        benchmark: 'Recommended: 20% or higher',
      },
      emergencyFund: {
        monthsCovered: Math.round(emergencyFundMonths * 100) / 100,
        status: getEmergencyFundStatus(emergencyFundMonths),
        recommendation:
          emergencyFundMonths < 3
            ? 'Build to 3-6 months of expenses'
            : 'Well funded',
      },
      debtLoad: {
        totalDebt,
        status:
          totalDebt === 0
            ? 'excellent'
            : totalDebt < totalMonthlyIncome * 6
              ? 'manageable'
              : 'concerning',
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
    projections,
    generatedAt: new Date().toISOString(),
  };
}

function calculateHealthScore({
  debtToIncomeRatio,
  savingsRate,
  emergencyFundMonths,
  netWorth,
  disposableIncome,
}: {
  debtToIncomeRatio: number;
  savingsRate: number;
  emergencyFundMonths: number;
  netWorth: number;
  disposableIncome: number;
}) {
  let score = 100;

  // Debt-to-income ratio (30% weight)
  if (debtToIncomeRatio > 50) score -= 30;
  else if (debtToIncomeRatio > 36) score -= 20;
  else if (debtToIncomeRatio > 25) score -= 10;

  // Savings rate (25% weight)
  if (savingsRate < 0) score -= 25;
  else if (savingsRate < 10) score -= 20;
  else if (savingsRate < 15) score -= 10;
  else if (savingsRate >= 20) score += 5;

  // Emergency fund (25% weight)
  if (emergencyFundMonths < 1) score -= 25;
  else if (emergencyFundMonths < 3) score -= 15;
  else if (emergencyFundMonths < 6) score -= 5;
  else if (emergencyFundMonths >= 6) score += 5;

  // Net worth and cash flow (20% weight)
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

  return {
    overall: grade,
    grade: Math.round(score),
    description,
  };
}

function getDebtToIncomeStatus(ratio: number): string {
  if (ratio <= 25) return 'excellent';
  if (ratio <= 36) return 'good';
  if (ratio <= 50) return 'fair';
  return 'poor';
}

function getSavingsRateStatus(rate: number): string {
  if (rate >= 20) return 'excellent';
  if (rate >= 15) return 'good';
  if (rate >= 10) return 'fair';
  if (rate >= 0) return 'poor';
  return 'critical';
}

function getEmergencyFundStatus(months: number): string {
  if (months >= 6) return 'excellent';
  if (months >= 3) return 'good';
  if (months >= 1) return 'fair';
  return 'poor';
}

function generateRecommendations({
  debtToIncomeRatio,
  savingsRate,
  emergencyFundMonths,
  totalDebt,
  disposableIncome,
  expenseCategories,
  profile,
}: {
  debtToIncomeRatio: number;
  savingsRate: number;
  emergencyFundMonths: number;
  totalDebt: number;
  disposableIncome: number;
  expenseCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  profile: z.infer<typeof FinancialProfileInputSchema>;
}) {
  const recommendations = [];

  // Emergency fund recommendations
  if (emergencyFundMonths < 3) {
    recommendations.push({
      id: 'emergency-fund',
      priority: 'high',
      category: 'savings',
      title: 'Build Emergency Fund',
      description:
        'Your emergency fund covers less than 3 months of expenses. This should be your top priority.',
      impact: 'High - Protects against financial emergencies',
      timeframe: '3-6 months',
      actionSteps: [
        'Open a high-yield savings account',
        'Set up automatic transfers of $200-500 monthly',
        'Start with $1,000 mini emergency fund',
        'Gradually build to 3-6 months of expenses',
      ],
    });
  }

  // Debt recommendations
  if (debtToIncomeRatio > 36) {
    recommendations.push({
      id: 'debt-reduction',
      priority: 'high',
      category: 'debt',
      title: 'Reduce Debt Load',
      description:
        'Your debt-to-income ratio is above recommended levels. Focus on debt reduction.',
      impact: 'High - Improves cash flow and reduces interest payments',
      timeframe: '6-24 months',
      actionSteps: [
        'List all debts with interest rates',
        'Use debt avalanche method (pay highest interest first)',
        'Consider debt consolidation if beneficial',
        'Avoid taking on new debt',
      ],
    });
  }

  // Savings rate recommendations
  if (savingsRate < 15) {
    recommendations.push({
      id: 'increase-savings',
      priority: 'medium',
      category: 'savings',
      title: 'Increase Savings Rate',
      description:
        'Your savings rate is below the recommended 15-20%. Look for ways to save more.',
      impact: 'Medium - Builds long-term wealth',
      timeframe: '3-12 months',
      actionSteps: [
        'Track expenses for one month',
        'Identify areas to cut spending',
        'Automate savings transfers',
        'Increase savings by 1% monthly until reaching 20%',
      ],
    });
  }

  // Expense optimization
  const highestExpense = expenseCategories.reduce(
    (max, cat) => (cat.percentage > max.percentage ? cat : max),
    expenseCategories[0] || { percentage: 0 }
  );

  if (highestExpense && highestExpense.percentage > 40) {
    recommendations.push({
      id: 'optimize-expenses',
      priority: 'medium',
      category: 'expenses',
      title: `Optimize ${highestExpense.category} Spending`,
      description: `${highestExpense.category} represents ${Math.round(highestExpense.percentage)}% of your expenses, which may be too high.`,
      impact: 'Medium - Frees up money for savings and debt reduction',
      timeframe: '1-3 months',
      actionSteps: [
        `Review all ${highestExpense.category.toLowerCase()} expenses`,
        'Compare prices and look for alternatives',
        'Negotiate better rates where possible',
        'Set a monthly budget limit',
      ],
    });
  }

  // Income recommendations
  if (disposableIncome < 500) {
    recommendations.push({
      id: 'increase-income',
      priority: 'medium',
      category: 'income',
      title: 'Explore Income Opportunities',
      description:
        'Your disposable income is limited. Consider ways to increase earnings.',
      impact: 'High - Provides more financial flexibility',
      timeframe: '3-12 months',
      actionSteps: [
        'Evaluate opportunities for promotion or raise',
        'Develop additional skills for career advancement',
        'Consider side hustles or freelance work',
        'Explore passive income opportunities',
      ],
    });
  }

  // Goals-based recommendations using profile data
  if (profile.goals.length > 0 && totalDebt > 0) {
    const shortTermGoals = profile.goals.filter((goal) =>
      goal.type.toLowerCase().includes('short')
    );
    if (shortTermGoals.length > 0) {
      recommendations.push({
        id: 'prioritize-goals',
        priority: 'low',
        category: 'goals',
        title: 'Prioritize Financial Goals',
        description:
          'Consider prioritizing debt reduction before pursuing short-term goals.',
        impact: 'Medium - Optimizes financial strategy',
        timeframe: '1-6 months',
        actionSteps: [
          'List all financial goals with target dates',
          'Calculate total cost of short-term goals',
          'Consider delaying non-essential goals until debt is reduced',
          'Focus on emergency fund and debt reduction first',
        ],
      });
    }
  }

  return recommendations;
}

function calculateProjections({
  currentSavings,
  currentDebt,
  monthlyIncome,
  savingsRate,
}: {
  currentSavings: number;
  currentDebt: number;
  monthlyIncome: number;
  savingsRate: number;
}) {
  const monthlySavings = (monthlyIncome * savingsRate) / 100;
  const monthlyDebtPayment = Math.min(monthlySavings * 0.3, currentDebt / 24); // Assume 2-year debt payoff goal

  // 1-year projections
  const oneYearSavings = currentSavings + monthlySavings * 12;
  const oneYearDebt = Math.max(0, currentDebt - monthlyDebtPayment * 12);
  const oneYearNetWorth = oneYearSavings - oneYearDebt;

  // 5-year projections (with 3% annual growth on savings)
  const fiveYearSavings =
    oneYearSavings * Math.pow(1.03, 4) + monthlySavings * 48;
  const fiveYearDebt = Math.max(0, currentDebt - monthlyDebtPayment * 60);
  const fiveYearNetWorth = fiveYearSavings - fiveYearDebt;

  return {
    oneYear: {
      netWorth: Math.round(oneYearNetWorth),
      savings: Math.round(oneYearSavings),
      debtReduction: Math.round(currentDebt - oneYearDebt),
    },
    fiveYear: {
      netWorth: Math.round(fiveYearNetWorth),
      savings: Math.round(fiveYearSavings),
      debtReduction: Math.round(currentDebt - fiveYearDebt),
    },
  };
}
