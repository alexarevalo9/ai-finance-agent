'use client';

import React, { useState, useEffect } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { BarChart3 } from 'lucide-react';
import CustomStepper from '@/components/custom-stepper';

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'complete';
  duration: number; // in milliseconds
}

interface AnalysisGenerationProps {
  onComplete: () => void;
  onStepComplete?: (stepIndex: number) => void;
  isCompleted?: boolean;
}

const mockSteps: AnalysisStep[] = [
  {
    id: '1',
    title: 'Analysis Started',
    description: 'Initializing comprehensive financial analysis engine',
    status: 'pending',
    duration: 1000,
  },
  {
    id: '2',
    title: 'Gathering Portfolio Data',
    description:
      'Collecting and validating your investment portfolio information',
    status: 'pending',
    duration: 1500,
  },
  {
    id: '3',
    title: 'Analyzing Risk Profile',
    description: 'Evaluating your risk tolerance and investment timeline',
    status: 'pending',
    duration: 2000,
  },
  {
    id: '4',
    title: 'Evaluating Asset Allocation',
    description: 'Examining current portfolio distribution and sector exposure',
    status: 'pending',
    duration: 1800,
  },
  {
    id: '5',
    title: 'Generating Recommendations',
    description:
      'Creating personalized investment strategies and optimizations',
    status: 'pending',
    duration: 2200,
  },
  {
    id: '6',
    title: 'Calculating Projections',
    description: 'Projecting future portfolio performance and growth scenarios',
    status: 'pending',
    duration: 1600,
  },
  {
    id: '7',
    title: 'Analysis Complete!',
    description: 'Your comprehensive financial analysis report is ready',
    status: 'pending',
    duration: 800,
  },
];

// Create a version of all steps completed for the finished state
const allStepsCompleted = mockSteps.map((step) => ({
  ...step,
  status: 'complete' as const,
}));

const AnalysisGeneration: React.FC<AnalysisGenerationProps> = ({
  onComplete,
  onStepComplete,
  isCompleted = false,
}) => {
  const [steps, setSteps] = useState<AnalysisStep[]>(mockSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // If the component is marked as completed, show all steps as complete
  useEffect(() => {
    if (isCompleted) {
      setSteps(allStepsCompleted);
      setCurrentStepIndex(mockSteps.length);
      return;
    }
  }, [isCompleted]);

  useEffect(() => {
    // Don't run the animation if already completed
    if (isCompleted) return;

    if (currentStepIndex >= steps.length) {
      // All steps complete, trigger final completion
      setTimeout(() => {
        onComplete();
      }, 1000);
      return;
    }

    const currentStep = steps[currentStepIndex];

    // Mark current step as loading
    setSteps((prev) =>
      prev.map((step, index) =>
        index === currentStepIndex ? { ...step, status: 'loading' } : step
      )
    );

    // Complete current step after duration
    const timer = setTimeout(() => {
      setSteps((prev) =>
        prev.map((step, index) =>
          index === currentStepIndex ? { ...step, status: 'complete' } : step
        )
      );

      // Notify parent component about step completion
      if (onStepComplete) {
        onStepComplete(currentStepIndex);
      }

      // Move to next step after a brief pause
      setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, 300);
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [currentStepIndex, steps.length, onComplete, onStepComplete, isCompleted]);

  return (
    <div className='flex gap-3 justify-start'>
      <Avatar className='h-8 w-8 mt-1'>
        <div className='bg-primary text-primary-foreground flex items-center justify-center h-full w-full rounded-full'>
          <BarChart3 size={16} />
        </div>
      </Avatar>
      <div className='flex flex-col max-w-[80%] items-start'>
        <div className='border rounded-xl p-6 bg-background shadow-sm w-full'>
          <div className='mb-6'>
            <h3 className='font-semibold text-lg mb-2'>
              {isCompleted
                ? 'Financial Analysis Generated'
                : 'Generating Financial Analysis'}
            </h3>
            <p className='text-sm text-muted-foreground'>
              {isCompleted
                ? 'Your comprehensive financial analysis report has been generated successfully.'
                : 'Creating your personalized financial analysis report...'}
            </p>
          </div>

          <CustomStepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            isCompleted={isCompleted}
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisGeneration;
