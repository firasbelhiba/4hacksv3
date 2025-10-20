'use client';

import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WizardStep, WizardStepInfo } from '@/lib/validations/hackathon';

interface StepIndicatorProps {
  steps: WizardStepInfo[];
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
  className?: string;
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: StepIndicatorProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn('w-full', className)}>
      {/* Mobile Step Indicator */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">
            Step {currentStepIndex + 1} of {steps.length}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(((currentStepIndex + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2 mb-4">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground">
            {steps[currentStepIndex]?.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {steps[currentStepIndex]?.description}
          </p>
        </div>
      </div>

      {/* Desktop Step Indicator */}
      <div className="hidden md:block">
        <nav aria-label="Progress">
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" style={{ marginLeft: '2.5rem', marginRight: '2.5rem' }} />

            {/* Progress Line */}
            <div className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500"
                 style={{
                   marginLeft: '2.5rem',
                   width: `calc(${((currentStepIndex) / (steps.length - 1)) * 100}% - 2.5rem)`
                 }} />

            <ol className="relative flex justify-between">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.id);
                const isCurrent = step.id === currentStep;
                const isClickable = onStepClick && (isCompleted || isCurrent);

                return (
                  <li key={step.id} className="flex flex-col items-center">
                    {/* Step */}
                    <button
                      type="button"
                      className={cn(
                        'relative flex flex-col items-center group transition-all duration-200',
                        isClickable && 'cursor-pointer hover:scale-105',
                        !isClickable && 'cursor-default'
                      )}
                      onClick={isClickable ? () => onStepClick(step.id) : undefined}
                      disabled={!isClickable}
                    >
                      {/* Step Circle */}
                      <div
                        className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-full border-2 mb-3 z-10 bg-background transition-all duration-200',
                          isCompleted &&
                            'bg-gradient-to-r from-purple-500 to-violet-500 border-purple-500 text-white',
                          isCurrent &&
                            !isCompleted &&
                            'border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
                          !isCurrent &&
                            !isCompleted &&
                            'border-muted-foreground/30 bg-background text-muted-foreground',
                          isClickable && 'group-hover:scale-110'
                        )}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <span className="text-sm font-semibold">
                            {index + 1}
                          </span>
                        )}
                      </div>

                      {/* Step Info */}
                      <div className="text-center max-w-32">
                        <h3
                          className={cn(
                            'text-sm font-medium transition-colors duration-200 leading-tight',
                            isCurrent && 'text-purple-600 dark:text-purple-400',
                            isCompleted && 'text-foreground',
                            !isCurrent && !isCompleted && 'text-muted-foreground'
                          )}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={cn(
                            'text-xs mt-1 transition-colors duration-200 leading-tight',
                            isCurrent && 'text-purple-600/80 dark:text-purple-400/80',
                            !isCurrent && 'text-muted-foreground'
                          )}
                        >
                          {step.description}
                        </p>
                      </div>

                      {/* Current Step Indicator */}
                      {isCurrent && (
                        <motion.div
                          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
                        </motion.div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>
      </div>
    </div>
  );
}

// Alternative compact step indicator for smaller spaces
export function CompactStepIndicator({
  steps,
  currentStep,
  completedSteps,
  className,
}: Omit<StepIndicatorProps, 'onStepClick'>) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;

        return (
          <div
            key={step.id}
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200',
              isCompleted &&
                'bg-gradient-to-r from-purple-500 to-violet-500 text-white',
              isCurrent &&
                !isCompleted &&
                'border-2 border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
              !isCurrent &&
                !isCompleted &&
                'border border-muted-foreground/30 bg-background text-muted-foreground'
            )}
          >
            {isCompleted ? (
              <Check className="w-4 h-4" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}