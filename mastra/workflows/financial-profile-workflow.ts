import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

export const FinancialProfileSchema = z.object({
  personalInfo: z.object({
    name: z.string().describe('Full name'),
    age: z.number().min(18).max(100).describe('Age in years'),
    location: z.string().describe('City and country/state'),
    familyStatus: z
      .enum(['single', 'married', 'divorced', 'widowed'])
      .describe('Marital status'),
  }),
  incomes: z.array(
    z.object({
      source: z.string().describe('Source of income'),
      amount: z.number().min(0).describe('Monthly amount from this source'),
      frequency: z
        .string()
        .describe('Frequency of income (monthly, weekly, daily)'),
    })
  ),
  expenses: z.array(
    z.object({
      category: z.string().describe('Category of expense'),
      amount: z.number().min(0).describe('Monthly amount from this expense'),
    })
  ),
  debts: z.array(
    z.object({
      type: z.string().describe('Type of debt'),
      amount: z.number().min(0).describe('Total debt amount'),
    })
  ),
  savings: z.array(
    z.object({
      type: z.string().describe('Type of savings'),
      amount: z.number().min(0).describe('Amount of savings'),
    })
  ),
  goals: z.array(
    z.object({
      title: z.string().describe('Title of the goal'),
      targetAmount: z.number().min(0).describe('Target amount for the goal'),
      type: z.string().describe('Type of goal (short-term, long-term, other)'),
    })
  ),
  riskTolerance: z
    .string()
    .describe('Investment risk tolerance (low, medium, high)'),
});

// Input schema for starting the workflow
const financialProfileInputSchema = z.object({
  userId: z.string().describe('Unique identifier for the user'),
  sessionId: z.string().optional().describe('Session identifier for tracking'),
  currentStep: z.string().optional().describe('Current step of the workflow'),
});

// Shared step data schema
const stepDataSchema = z.object({
  userId: z.string(),
  sessionId: z.string(),
  startTime: z.string(),
  currentStep: z.string(),
  profileData: z.record(z.any()),
  stepCompleted: z.boolean().optional(),
  nextStep: z.string().optional(),
});

// Output schema for the complete profile
const financialProfileOutputSchema = z.object({
  userId: z.string(),
  profile: FinancialProfileSchema,
  sessionMetadata: z.object({
    startTime: z.string(),
    endTime: z.string(),
    totalSteps: z.number(),
    completionTime: z.number(),
  }),
  validationResults: z.object({
    isValid: z.boolean(),
    completenessScore: z.number(),
    missingFields: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),
});

// Step 1: Initialize and collect all financial profile data through guided conversation
const collectFinancialProfile = createStep({
  id: 'collect-financial-profile',
  description: 'Guide user through complete financial profile collection',
  inputSchema: financialProfileInputSchema,
  outputSchema: stepDataSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('financialProfileAgent');
    if (!agent) {
      throw new Error('Financial Profile Agent not found');
    }

    const sessionId =
      inputData.sessionId ||
      `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();

    const response = await agent.generate([
      {
        role: 'user',
        content: 'Hello',
      },
    ]);

    console.log('==========>>>', response.text);

    return {
      userId: inputData.userId,
      sessionId,
      startTime,
      currentStep: 'collection-complete',
      profileData: JSON.parse(response.text),
      stepCompleted: true,
      nextStep: 'finalize',
    };
  },
});

// Step 2: Finalize and validate the complete profile
const finalizeProfile = createStep({
  id: 'finalize-profile',
  description: 'Validate and finalize the complete financial profile',
  inputSchema: stepDataSchema,
  outputSchema: financialProfileOutputSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const agent = mastra?.getAgent('financialProfileAgent');
    if (!agent) {
      throw new Error('Financial Profile Agent not found');
    }

    const endTime = new Date().toISOString();
    const completionTime =
      new Date(endTime).getTime() - new Date(inputData.startTime).getTime();

    // In production, the agent would finalize the profile using the captureFinancialProfileTool
    // with step 'complete' to validate and structure the final profile.
    // For this demo, we create a mock complete profile.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const completedProfile = {} as any;

    // Calculate validation metrics
    const completenessScore = calculateCompletenessScore(completedProfile);
    const missingFields = findMissingFields(completedProfile);
    const recommendations = generateRecommendations(completedProfile);

    return {
      userId: inputData.userId,
      profile: completedProfile,
      sessionMetadata: {
        startTime: inputData.startTime,
        endTime,
        totalSteps: 2,
        completionTime,
      },
      validationResults: {
        isValid: missingFields.length === 0,
        completenessScore,
        missingFields,
        recommendations,
      },
    };
  },
});

// Helper functions for validation
function calculateCompletenessScore(profile: Record<string, unknown>): number {
  let totalFields = 0;
  let completedFields = 0;

  function countFields(obj: Record<string, unknown>) {
    for (const [, value] of Object.entries(obj)) {
      totalFields++;
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== 0
      ) {
        completedFields++;
      }
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        countFields(value as Record<string, unknown>);
      }
    }
  }

  countFields(profile);
  return Math.round((completedFields / totalFields) * 100);
}

function findMissingFields(profile: Record<string, unknown>): string[] {
  const missing: string[] = [];

  // Check for essential fields - simplified type checking
  const personalInfo = profile.personalInfo as
    | Record<string, unknown>
    | undefined;
  const income = profile.income as Record<string, unknown> | undefined;
  const expenses = profile.expenses as Record<string, unknown> | undefined;
  const debts = profile.debts as Record<string, unknown> | undefined;
  const savings = profile.savings as Record<string, unknown> | undefined;
  const goals = profile.goals as Record<string, unknown> | undefined;

  if (!personalInfo?.name) missing.push('personalInfo.name');
  if (!income?.monthlyNetIncome) missing.push('income.monthlyNetIncome');
  if (!expenses?.totalMonthlyExpenses)
    missing.push('expenses.totalMonthlyExpenses');
  if (debts?.totalDebt === undefined) missing.push('debts.totalDebt');
  if (savings?.totalSavings === undefined) missing.push('savings.totalSavings');
  if (!goals?.riskTolerance) missing.push('goals.riskTolerance');

  return missing;
}

function generateRecommendations(profile: Record<string, unknown>): string[] {
  const recommendations: string[] = [];

  const income = profile.income as Record<string, unknown> | undefined;
  const expenses = profile.expenses as Record<string, unknown> | undefined;
  const savings = profile.savings as Record<string, unknown> | undefined;
  const goals = profile.goals as Record<string, unknown> | undefined;

  const monthlyIncome = (income?.monthlyNetIncome as number) || 0;
  const monthlyExpenses = (expenses?.totalMonthlyExpenses as number) || 0;
  const emergencyFund = (savings?.emergencyFund as number) || 0;

  if (monthlyExpenses > monthlyIncome * 0.9) {
    recommendations.push(
      'Consider reducing expenses as they are close to or exceed income'
    );
  }

  if (emergencyFund < monthlyExpenses * 3) {
    recommendations.push(
      'Build emergency fund to cover 3-6 months of expenses'
    );
  }

  const shortTermGoals = goals?.shortTermGoals as unknown[] | undefined;
  const longTermGoals = goals?.longTermGoals as unknown[] | undefined;

  if (!shortTermGoals?.length) {
    recommendations.push(
      'Consider setting specific short-term financial goals'
    );
  }

  if (!longTermGoals?.length) {
    recommendations.push(
      'Establish long-term financial goals for better planning'
    );
  }

  return recommendations;
}

// Create and export the workflow
export const financialProfileWorkflow = createWorkflow({
  id: 'financial-profile-workflow',
  inputSchema: financialProfileInputSchema,
  outputSchema: financialProfileOutputSchema,
})
  .then(collectFinancialProfile)
  .then(finalizeProfile);

financialProfileWorkflow.commit();
