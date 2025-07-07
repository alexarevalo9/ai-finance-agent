'use client';

import { useState } from 'react';
import Chat from '@/components/chat';
import FinancialAnalysis from '@/components/financial-analysis';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Home() {
  const isMobile = useIsMobile();
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisStepsCompleted, setAnalysisStepsCompleted] = useState(0);

  const handleStepComplete = (completedSteps: number) => {
    setAnalysisStepsCompleted(completedSteps);
  };

  const handleShowAnalysis = () => {
    setShowAnalysis(true);
  };

  const handleCloseAnalysis = () => {
    setShowAnalysis(false);
  };

  return (
    <div className='flex flex-col h-screen'>
      {isMobile && (
        <div className='fixed left-0 top-0 m-1 z-50'>
          <SidebarTrigger className='rounded-full bg-gray-200 p-4' />
        </div>
      )}

      <div className='flex flex-1 justify-center  min-h-0'>
        {/* Chat Section */}
        <div
          className={`transition-all duration-500 ease-in-out h-full ${
            showAnalysis ? 'w-4/12' : 'w-full'
          }`}
        >
          <Chat
            onShowAnalysis={handleShowAnalysis}
            showAnalysisPanel={showAnalysis}
            onStepComplete={handleStepComplete}
          />
        </div>

        {/* Analysis Section */}
        <div
          className={`transition-all duration-500 ease-in-out h-full ${
            showAnalysis ? 'w-8/12 opacity-100' : 'w-0 opacity-0'
          }`}
        >
          {showAnalysis && (
            <FinancialAnalysis
              onClose={handleCloseAnalysis}
              completedSteps={analysisStepsCompleted}
              isStreaming={analysisStepsCompleted < 7}
            />
          )}
        </div>
      </div>
    </div>
  );
}
