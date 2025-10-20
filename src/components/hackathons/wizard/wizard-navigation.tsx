'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { WizardStep } from '@/lib/validations/hackathon';

interface WizardNavigationProps {
  currentStep: WizardStep;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  isDirty?: boolean;
  errors?: Record<string, any>;
  onNext: () => void;
  onPrevious: () => void;
  onSave?: () => void;
  onSubmit?: () => void;
  className?: string;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  canGoNext,
  canGoPrevious,
  isFirstStep,
  isLastStep,
  isLoading = false,
  isDirty = false,
  errors,
  onNext,
  onPrevious,
  onSave,
  onSubmit,
  className,
}: WizardNavigationProps) {
  const [saving, setSaving] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const hasErrors = errors && Object.keys(errors).length > 0;

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;

    try {
      await onSubmit();
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  return (
    <div className={cn('border-t border-border/50 bg-background/80 backdrop-blur-sm', className)}>
      <div className="flex items-center justify-between p-6">
        {/* Left Side - Previous Button */}
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious || isLoading}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {/* Save Draft Button */}
          {onSave && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={handleSave}
                disabled={saving || isLoading}
                className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              >
                <Save className={cn('w-4 h-4', saving && 'animate-spin')} />
                <span>{saving ? 'Saving...' : 'Save Draft'}</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Clear all saved form data? This cannot be undone.')) {
                    localStorage.removeItem('wizard_hackathon-create');
                    window.location.reload();
                  }
                }}
                disabled={isLoading}
                className="flex items-center space-x-2 text-muted-foreground hover:text-red-600"
                title="Clear saved form data"
              >
                <span className="text-xs">Clear Draft</span>
              </Button>
            </div>
          )}
        </div>

        {/* Center - Step Info and Validation */}
        <div className="flex items-center space-x-4">
          {/* Unsaved Changes Indicator */}
          {isDirty && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-amber-600 dark:text-amber-400"
            >
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Unsaved changes</span>
            </motion.div>
          )}

          {/* Validation Errors */}
          {hasErrors && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center space-x-2 text-red-600 dark:text-red-400"
            >
              <AlertTriangle className="w-4 h-4" />
              <button
                onClick={() => setShowErrorModal(true)}
                className="text-sm hover:underline cursor-pointer text-left"
              >
                <div className="font-medium">
                  {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''} - Click to view
                </div>
                {/* Show first error as preview */}
                <div className="text-xs mt-1 max-w-xs truncate">
                  {(() => {
                    const firstError = Object.values(errors)[0];
                    if (typeof firstError === 'string') {
                      return firstError;
                    } else if (firstError && typeof firstError === 'object') {
                      if (firstError.message) {
                        return firstError.message;
                      } else if (firstError.type) {
                        return `Validation error: ${firstError.type}`;
                      } else {
                        return 'Complex validation error - click to view details';
                      }
                    }
                    return String(firstError);
                  })()}
                </div>
              </button>
            </motion.div>
          )}

          {/* Step Progress */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Step</span>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors duration-200',
                    i < totalSteps
                      ? 'bg-gradient-to-r from-purple-500 to-violet-500'
                      : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Next/Submit Button */}
        <div className="flex items-center space-x-4">
          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!canGoNext || isLoading || hasErrors}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isLoading ? 'Creating...' : 'Create Hackathon'}</span>
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext || isLoading}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Step Progress Bar */}
      <div className="sm:hidden px-6 pb-4">
        <div className="w-full bg-muted rounded-full h-1">
          <motion.div
            className="bg-gradient-to-r from-purple-500 to-violet-500 h-1 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalSteps / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Error Details Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Form Validation Errors
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Please fix the following errors before proceeding:
            </p>
            {hasErrors && (
              <div className="space-y-3">
                {Object.entries(errors).map(([key, error], index) => {
                  let errorMessage = '';

                  if (typeof error === 'string') {
                    errorMessage = error;
                  } else if (error && typeof error === 'object') {
                    if (error.message) {
                      errorMessage = error.message;
                    } else if (error.type) {
                      errorMessage = `Validation error: ${error.type}`;
                    } else if (Array.isArray(error)) {
                      errorMessage = error.join(', ');
                    } else {
                      // Show the actual object structure for debugging
                      errorMessage = JSON.stringify(error, null, 2);
                    }
                  } else {
                    errorMessage = String(error);
                  }

                  return (
                    <div key={key} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-red-600">{index + 1}</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-red-800">
                            Field: {key}
                          </div>
                          <div className="text-sm text-red-700 mt-1 whitespace-pre-wrap font-mono">
                            {errorMessage}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end">
              <Button
                onClick={() => setShowErrorModal(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simplified navigation for smaller spaces
export function CompactWizardNavigation({
  canGoNext,
  canGoPrevious,
  isFirstStep,
  isLastStep,
  isLoading = false,
  onNext,
  onPrevious,
  onSubmit,
  className,
}: Pick<
  WizardNavigationProps,
  | 'canGoNext'
  | 'canGoPrevious'
  | 'isFirstStep'
  | 'isLastStep'
  | 'isLoading'
  | 'onNext'
  | 'onPrevious'
  | 'onSubmit'
  | 'className'
>) {
  return (
    <div className={cn('flex items-center justify-between space-x-4', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious || isLoading}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {isLastStep ? (
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!canGoNext || isLoading}
          className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={onNext}
          disabled={!canGoNext || isLoading}
          className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}