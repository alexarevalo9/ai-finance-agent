# Mastra Financial Profile Agent

This directory contains a comprehensive financial profile collection system built with Mastra following MCP (Model Context Protocol) best practices.

## Overview

The Financial Profile Agent is designed to capture complete financial information from users through an intuitive conversational interface. It follows MCP best practices for structured data collection and requires user action intervention on each question.

## Components

### 1. Financial Profile Tool (`tools/financial-profile-tool.ts`)

A comprehensive tool that captures structured financial data including:

- **Personal Information**: Name, age, location, family status, dependents
- **Income**: Primary sources, monthly amounts, stability, additional income
- **Expenses**: Housing, utilities, transportation, groceries, healthcare, entertainment, subscriptions
- **Debts**: Credit cards, loans, mortgage with balances and interest rates
- **Savings**: Emergency fund, savings accounts, investment portfolio
- **Goals**: Short-term and long-term financial goals, retirement planning, risk tolerance

**Key Features:**

- Step-by-step data collection process
- Consistent JSON structure output
- Progress tracking with completion percentages
- Data validation and extraction from natural language responses
- Zod schema validation for type safety

### 2. Financial Profile Agent (`agents/financial-profile-agent.ts`)

A conversational agent that guides users through the financial profile collection process.

**Capabilities:**

- Warm, professional conversation style
- Explains why information is needed to build trust
- Breaks down complex sections into manageable parts
- Validates and clarifies responses
- Maintains data privacy and confidentiality
- Uses the captureFinancialProfileTool to track progress

### 3. Financial Profile Workflow (`workflows/financial-profile-workflow.ts`)

An orchestrated workflow that manages the complete profile collection process.

**Workflow Steps:**

1. **Collection Phase**: Guides user through all financial data sections
2. **Finalization Phase**: Validates completeness and generates final structured profile

**Output Includes:**

- Complete financial profile in consistent JSON format
- Session metadata (timing, steps completed)
- Validation results (completeness score, missing fields, recommendations)

## Data Structure

The system always returns the same JSON structure regardless of user responses:

```typescript
{
  personalInfo: {
    name: string,
    age: number,
    location: string,
    familyStatus: 'single' | 'married' | 'divorced' | 'widowed',
    dependents: number
  },
  income: {
    primarySource: string,
    monthlyGrossIncome: number,
    monthlyNetIncome: number,
    additionalIncome: Array<{source: string, monthlyAmount: number}>,
    incomeStability: 'very-stable' | 'stable' | 'variable' | 'unstable'
  },
  expenses: {
    housing: {type: string, monthlyAmount: number},
    utilities: number,
    transportation: number,
    groceries: number,
    healthcare: number,
    entertainment: number,
    subscriptions: number,
    other: number,
    totalMonthlyExpenses: number
  },
  debts: {
    creditCards: Array<{name: string, balance: number, minimumPayment: number, interestRate: number}>,
    loans: Array<{type: string, balance: number, monthlyPayment: number, interestRate: number}>,
    mortgage: {balance: number, monthlyPayment: number, interestRate: number},
    totalDebt: number
  },
  savings: {
    emergencyFund: number,
    savingsAccounts: Array<{type: string, balance: number, interestRate: number}>,
    investments: {
      stocks: number,
      bonds: number,
      mutualFunds: number,
      retirement401k: number,
      ira: number,
      realEstate: number,
      crypto: number,
      other: number
    },
    totalSavings: number
  },
  goals: {
    shortTermGoals: Array<{description: string, targetAmount: number, timeframe: string, priority: string}>,
    longTermGoals: Array<{description: string, targetAmount: number, timeframe: string, priority: string}>,
    retirementPlanning: {
      targetRetirementAge: number,
      estimatedAnnualExpenses: number,
      currentRetirementSavings: number
    },
    riskTolerance: 'conservative' | 'moderate' | 'aggressive'
  },
  profileCompletedAt: string, // ISO timestamp
  profileVersion: string
}
```

## Usage

### Starting a Financial Profile Collection

```typescript
import { mastra } from './mastra';

// Start the workflow
const result = await mastra.runWorkflow({
  name: 'financialProfileWorkflow',
  input: {
    userId: 'user-123',
    sessionId: 'optional-session-id',
  },
});

// Access the complete profile
const profile = result.profile;
const validationResults = result.validationResults;
```

### Using the Agent Directly

```typescript
import { mastra } from './mastra';

const agent = mastra.getAgent('financialProfileAgent');

const response = await agent.stream([
  {
    role: 'user',
    content: 'I want to create my financial profile',
  },
]);

// The agent will guide through the process step by step
```

### Using the Tool for Custom Integration

```typescript
import { captureFinancialProfileTool } from './tools/financial-profile-tool';

// Start with personal info
const result = await captureFinancialProfileTool.execute({
  context: {
    step: 'personal-info',
    currentData: {},
    userResponse: 'My name is John Doe, I am 35 years old...',
  },
});

// Continue with next step
const nextResult = await captureFinancialProfileTool.execute({
  context: {
    step: result.nextStep,
    currentData: result.updatedData,
    userResponse: 'I work as a software engineer...',
  },
});
```

## MCP Best Practices Implemented

1. **Tools for Interactive Functions**: The `captureFinancialProfileTool` handles step-by-step data collection
2. **Structured Schemas**: Comprehensive Zod schemas ensure type safety and validation
3. **Consistent Output**: Always returns the same JSON structure regardless of input variations
4. **User Intervention Required**: Each step requires user input before proceeding
5. **Progress Tracking**: Users can see their progress through the collection process
6. **Error Handling**: Validates data and provides clear error messages
7. **Memory Integration**: Uses LibSQL storage for conversation persistence

## Integration with Frontend

The agent can be easily integrated into a chat interface where:

1. Users start by requesting to create their financial profile
2. The agent guides them through each section with clear questions
3. Progress is shown as they complete each step
4. The final structured profile is returned for use in financial planning tools

## Security & Privacy

- All financial data is handled securely through Mastra's built-in security features
- Data is only stored in memory by default (configure persistent storage as needed)
- Clear privacy explanations are provided to users during collection
- Data validation prevents malicious input

## Extension Points

The system can be extended to:

- Add more detailed financial product information
- Integrate with external financial APIs for verification
- Add more sophisticated natural language processing for data extraction
- Implement additional validation rules based on financial best practices
- Add support for multiple currencies and international financial products
