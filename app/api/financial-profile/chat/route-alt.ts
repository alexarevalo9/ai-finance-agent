import { NextRequest, NextResponse } from 'next/server';
import { mastra } from '@/mastra';

export async function POST(request: NextRequest) {
  try {
    const {
      sessionId,
      step,
      currentData,
      conversationHistory = [],
    } = await request.json();

    // Get the financial profile agent
    const agent = mastra.getAgent('financialProfileAgent');

    if (!agent) {
      return NextResponse.json(
        { error: 'Financial Profile Agent not available' },
        { status: 500 }
      );
    }

    // Build conversation history for context
    const messages = [
      {
        role: 'system' as const,
        content: `You are currently in step "${step}" of the financial profile collection process. Session ID: ${sessionId}. Current collected data: ${JSON.stringify(currentData, null, 2)}`,
      },
      ...conversationHistory,
    ];

    console.log('==========>>>', messages);

    // Get response from the agent
    const response = await agent.stream(messages);

    let agentResponse = '';
    for await (const chunk of response.textStream) {
      agentResponse += chunk;
    }

    return NextResponse.json({
      message: agentResponse,
      step,
      sessionId,
    });
  } catch (error) {
    console.error('Error in financial profile chat:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
