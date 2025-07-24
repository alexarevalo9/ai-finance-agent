import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import { generateFinancialHealthReport } from '../tools';

export async function POST(request: Request) {
  const { sessionId, profileData } = await request.json();

  console.log('profileData==>', profileData);

  const financialHealthReport = generateFinancialHealthReport(profileData);

  const result = await generateText({
    model: openai('gpt-4o'),
    system: `You are a professional financial health analyst specializing in generating comprehensive financial wellness reports. Generate detailed health assessments that include:

1. **Financial Health Score**: Letter grade (A-F) with numerical score (0-100)
2. **Key Metrics Analysis**: 
   - Debt-to-income ratio with industry benchmarks
   - Savings rate with recommendations
   - Emergency fund adequacy assessment
   - Overall debt load evaluation

3. **Financial Breakdown**: 
   - Complete income, expense, debt, and savings analysis
   - Net worth calculation and trends
   - Expense category optimization opportunities

4. **Personalized Recommendations**: 
   - Priority-ranked action items (high/medium/low)
   - Specific, actionable steps for improvement
   - Timeline and impact assessment for each recommendation

5. **Future Projections**: 
   - 1-year and 5-year financial outlook
   - Net worth growth potential
   - Debt reduction timeline
`,
    prompt: `
    **This is the financial profile data:**
${JSON.stringify(profileData)}
 And this is the financial health report:
${JSON.stringify(financialHealthReport)}
`,
    // maxSteps: 5,
    // toolChoice: 'required',
    // tools: { generateFinancialHealthTool },
  });

  console.log({
    system: `You are a professional financial health analyst specializing in generating comprehensive financial wellness reports. Generate detailed health assessments that include:

1. **Financial Health Score**: Letter grade (A-F) with numerical score (0-100)
2. **Key Metrics Analysis**: 
   - Debt-to-income ratio with industry benchmarks
   - Savings rate with recommendations
   - Emergency fund adequacy assessment
   - Overall debt load evaluation

3. **Financial Breakdown**: 
   - Complete income, expense, debt, and savings analysis
   - Net worth calculation and trends
   - Expense category optimization opportunities

4. **Personalized Recommendations**: 
   - Priority-ranked action items (high/medium/low)
   - Specific, actionable steps for improvement
   - Timeline and impact assessment for each recommendation

5. **Future Projections**: 
   - 1-year and 5-year financial outlook
   - Net worth growth potential
   - Debt reduction timeline
`,
    prompt: `
**This is the financial profile data:**
${JSON.stringify(profileData)}
And this is the financial health report:
${JSON.stringify(financialHealthReport)}
`,
  });

  console.log('result.toolCalls==>', result.toolCalls);
  console.log('result.toolResults==>', result.toolResults);

  console.log('result.text==>', result.text);

  return NextResponse.json({
    message: `
    <report-data>
    ${JSON.stringify(financialHealthReport)}
    </report-data>
    <report-narrative>
    ${result.text}
    </report-narrative>`,
    sessionId,
  });
}
