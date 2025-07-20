'use client';

import React from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'loading' | 'complete';
}

interface CustomStepperProps {
  steps: Step[];
  currentStepIndex: number;
  isCompleted?: boolean;
}

const CustomStepper: React.FC<CustomStepperProps> = ({
  steps,
  currentStepIndex,
  isCompleted = false,
}) => {
  const getVisibleSteps = () => {
    if (isCompleted) {
      return steps;
    }
    // Show only steps up to current step (so we reveal them incrementally)
    return steps.slice(0, currentStepIndex + 1);
  };

  const getStepIcon = (step: Step) => {
    if (step.status === 'complete') {
      return (
        <div className='w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
          <CheckCircle size={16} className='text-white' />
        </div>
      );
    } else if (step.status === 'loading') {
      return (
        <div className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center'>
          <Loader2 size={12} className='text-white animate-spin' />
        </div>
      );
    } else {
      return (
        <div className='w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center'>
          <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
        </div>
      );
    }
  };

  const getStepTextColor = (step: Step) => {
    if (step.status === 'complete') {
      return 'text-gray-900';
    } else if (step.status === 'loading') {
      return 'text-gray-900';
    } else {
      return 'text-gray-500';
    }
  };

  const getAdditionalDetails = (step: Step, stepIndex: number) => {
    if (step.status !== 'complete') return null;

    const details: { [key: number]: string[] } = {
      0: ['Portfolio analysis engine initialized with your data.'],
      1: [
        'Collected investment accounts, holdings, and transaction history.',
        'Validated data integrity and completeness.',
      ],
      2: [
        'Assessed your risk tolerance questionnaire responses.',
        'Analyzed investment timeline and financial goals.',
      ],
      3: [
        'Examined current asset distribution across all accounts.',
        'Identified sector concentration and geographic exposure.',
      ],
      4: [
        'Generated personalized investment strategies.',
        'Created optimization recommendations based on your profile.',
      ],
      5: [
        'Calculated future portfolio performance scenarios.',
        'Projected growth across multiple time horizons.',
      ],
      6: ['Your comprehensive financial analysis is now complete.'],
    };

    const stepDetails = details[stepIndex];
    if (!stepDetails) return null;

    return (
      <div className='mt-2 space-y-1'>
        {stepDetails.map((detail, index) => (
          <p key={index} className='text-sm text-gray-600'>
            {detail}
          </p>
        ))}
      </div>
    );
  };

  const visibleSteps = getVisibleSteps();

  return (
    <div className='relative'>
      {visibleSteps.map((step, index) => (
        <div key={step.id} className='relative flex items-start'>
          {/* Vertical line */}
          {index < visibleSteps.length - 1 && (
            <div className='absolute left-3 top-8 w-0.5 h-16 bg-gray-200'></div>
          )}

          {/* Step indicator */}
          <div className='flex-shrink-0 z-10'>{getStepIcon(step)}</div>

          {/* Step content */}
          <div className='ml-4 pb-8 flex-1'>
            <h4
              className={`font-medium text-sm mb-1 ${getStepTextColor(step)}`}
            >
              {step.title}
            </h4>
            <p className='text-sm text-gray-600 leading-relaxed'>
              {step.description}
            </p>

            {/* Additional details for completed steps */}
            {getAdditionalDetails(step, index)}

            {/* Progress bar for loading steps */}
            {step.status === 'loading' && (
              <div className='mt-3'>
                <div className='w-full bg-gray-200 rounded-full h-1'>
                  <div
                    className='bg-blue-500 h-1 rounded-full animate-pulse'
                    style={{ width: '60%' }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomStepper;
