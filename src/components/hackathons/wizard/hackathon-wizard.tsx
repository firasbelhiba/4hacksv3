'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import { StepIndicator } from './step-indicator';
import { WizardNavigation } from './wizard-navigation';
import { BasicInfoStep } from './basic-info-step';
import { ScheduleStep } from './schedule-step';
import { ReviewStep } from './review-step';
import {
  WIZARD_STEPS,
  HackathonWizardSchema,
  BasicInfoSchema,
  ScheduleSchema,
  SettingsSchema,
  DEFAULT_BASIC_INFO,
  DEFAULT_SCHEDULE,
  DEFAULT_SETTINGS,
} from '@/lib/validations/hackathon';
import type {
  WizardStep,
  HackathonWizard,
  BasicInfo,
  Schedule,
  Settings,
} from '@/lib/validations/hackathon';
import { apiClient } from '@/lib/api/client';
import { saveWizardProgress, loadWizardProgress, clearWizardProgress } from '@/lib/form-utils';
import { cn } from '@/lib/utils';

interface HackathonWizardProps {
  mode?: 'create' | 'edit';
  initialData?: HackathonWizard;
  hackathonId?: string;
  className?: string;
}

const stepSchemas = {
  basicInfo: BasicInfoSchema,
  schedule: ScheduleSchema,
  settings: SettingsSchema,
};

export function HackathonWizard({
  mode = 'create',
  initialData,
  hackathonId,
  className,
}: HackathonWizardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [currentStep, setCurrentStep] = useState<WizardStep>('basicInfo');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [autoSaving, setAutoSaving] = useState(false);
  const [wizardData, setWizardData] = useState<any>({
    basicInfo: {
      ...DEFAULT_BASIC_INFO,
      bannerImage: '', // Ensure bannerImage is always a string
      ...initialData?.basicInfo
    },
    schedule: { ...DEFAULT_SCHEDULE, ...initialData?.schedule },
    
    settings: { ...DEFAULT_SETTINGS, ...initialData?.settings },
  });

  const currentStepIndex = WIZARD_STEPS.findIndex(step => step.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === WIZARD_STEPS.length - 1;

  // Initialize form with current step schema
  const form = useForm({
    resolver: zodResolver(stepSchemas[currentStep]) as any,
    defaultValues: wizardData[currentStep] || {},
    mode: 'onChange',
  });

  const { formState: { errors, isValid, isDirty } } = form;

  // Helper function to extract step-specific data from form values
  const getStepSpecificData = (formData: any, step: WizardStep): any => {
    switch (step) {
      case 'basicInfo':
        return {
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          organizationName: formData.organizationName,
          prizePool: formData.prizePool,
          bannerImage: formData.bannerImage,
        };
      case 'schedule':
        return {
          startDate: formData.startDate,
          endDate: formData.endDate,
          timezone: formData.timezone,
          registrationDeadline: formData.registrationDeadline,
          evaluationPeriodEnd: formData.evaluationPeriodEnd,
          resultAnnouncementDate: formData.resultAnnouncementDate,
        };
      case 'settings':
        return {
          isPublic: formData.isPublic,
          requireGithubRepo: formData.requireGithubRepo,
          requireDemoVideo: formData.requireDemoVideo,
          autoStartEvaluation: formData.autoStartEvaluation,
          notifyParticipants: formData.notifyParticipants,
          registrationDeadline: formData.registrationDeadline,
        };
      default:
        return formData;
    }
  };

  // Helper function to extract readable error messages
  const extractErrorMessage = (error: any): string => {

    if (!error) return 'Unknown error';

    if (typeof error === 'string') {
      return error;
    }

    if (Array.isArray(error)) {
      return error.map(e => extractErrorMessage(e)).join(', ');
    }

    if (typeof error === 'object') {
      // Handle react-hook-form errors
      if (error.message) {
        return error.message;
      }

      // Handle zod errors
      if (error.type) {
        return `${error.type}: ${error.message || 'Validation failed'}`;
      }

      // Handle nested errors (like form validation errors)
      if (error.issues && Array.isArray(error.issues)) {
        return error.issues.map((issue: any) => issue.message || String(issue)).join(', ');
      }

      // Handle object with nested errors
      const keys = Object.keys(error);
      if (keys.length > 0) {
        return keys.map(key => {
          const value = error[key];
          if (typeof value === 'string') {
            return `${key}: ${value}`;
          }
          return `${key}: ${extractErrorMessage(value)}`;
        }).join(', ');
      }

      // Last resort - stringify the object
      try {
        return JSON.stringify(error, null, 2);
      } catch {
        return 'Complex error object (cannot stringify)';
      }
    }

    return String(error);
  };

  // Debug validation state
  React.useEffect(() => {
    console.log('Wizard Debug:', {
      currentStep,
      isValid,
      errors,
      formData: form.getValues(),
      canGoNext: isValid && !loading,
    });

    // Extra debugging for tracks errors
    if (errors && errors.tracks) {
      console.log('Tracks Error Debug:', {
        tracksErrorRaw: errors.tracks,
        tracksErrorStringified: String(errors.tracks),
        tracksErrorJSON: (() => {
          try {
            return JSON.stringify(errors.tracks, null, 2);
          } catch (e) {
            return 'Cannot stringify tracks error: ' + e;
          }
        })(),
        tracksErrorKeys: Object.keys(errors.tracks || {}),
        tracksErrorValues: Object.values(errors.tracks || {}),
        tracksErrorEntries: Object.entries(errors.tracks || {}),
      });
    }

    // Debug localStorage state
    if (mode === 'create') {
      const savedData = localStorage.getItem('wizard_hackathon-create');
      console.log('📁 Current localStorage data:', savedData ? JSON.parse(savedData) : null);
    }
  }, [currentStep, isValid, errors, loading, form, mode]);

  // Load saved progress on mount
  useEffect(() => {
    if (mode === 'create' && !initialData) {
      const savedProgress = loadWizardProgress('hackathon-create');
      if (savedProgress) {
        console.log('📁 Restored saved form data from localStorage:', {
          lastSaved: savedProgress.lastSaved,
          currentStep: savedProgress.currentStep,
          completedSteps: savedProgress.completedSteps,
          availableSteps: Object.keys(savedProgress).filter(k => !['lastSaved', 'currentStep', 'completedSteps'].includes(k))
        });

        // Show user that data was restored
        toast.success('Form data restored from previous session', {
          duration: 3000,
          icon: '📁'
        });

        setWizardData((prev: any) => ({ ...prev, ...savedProgress }));
        if (savedProgress.currentStep) {
          setCurrentStep(savedProgress.currentStep);
        }
        if (savedProgress.completedSteps) {
          setCompletedSteps(savedProgress.completedSteps);
        }
      }
    }
  }, [mode, initialData]);

  // Save on page unload/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (mode === 'create') {
        const currentData = form.getValues();
        const stepSpecificData = getStepSpecificData(currentData, currentStep);

        const finalData = {
          ...wizardData,
          [currentStep]: stepSpecificData,
          currentStep,
          completedSteps,
        };
        saveWizardProgress('hackathon-create', currentStep, finalData);
        console.log('💾 Final save before page unload');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode, currentStep, wizardData, completedSteps, form]);

  // Reset form when step changes to prevent data contamination
  useEffect(() => {
    const stepData = wizardData[currentStep] || {};
    console.log('🔄 Resetting form for step:', currentStep, 'with data:', stepData);

    // Reset form completely with step-specific data
    form.reset(stepData, { keepDefaultValues: false });
  }, [currentStep, form]);

  // Save progress to localStorage
  const saveProgress = useCallback((dataToSave?: any) => {
    if (mode === 'create') {
      const saveData = dataToSave || {
        ...wizardData,
        currentStep,
        completedSteps,
      };
      saveWizardProgress('hackathon-create', currentStep, saveData);
    }
  }, [mode, currentStep, wizardData, completedSteps]);

  // Auto-save on data change with debouncing
  useEffect(() => {
    if (mode !== 'create') return;

    setAutoSaving(true);
    const timeoutId = setTimeout(() => {
      saveProgress();
      setAutoSaving(false);
    }, 1000); // Reduced to 1 second for more responsive saving

    return () => {
      clearTimeout(timeoutId);
      setAutoSaving(false);
    };
  }, [wizardData, currentStep, completedSteps, saveProgress]);

  const validateCurrentStep = async (): Promise<boolean> => {
    const isFormValid = await form.trigger();
    return isFormValid;
  };

  const updateWizardData = (stepData: any) => {
    setWizardData((prev: any) => {
      const newData = {
        ...prev,
        [currentStep]: stepData,
      };

      // Auto-save for create mode only (localStorage)
      if (mode === 'create') {
        saveWizardProgress('hackathon-create', currentStep, {
          ...newData,
          currentStep,
          completedSteps,
        });
      }

      return newData;
    });
  };

  const goToStep = async (step: WizardStep) => {
    // Save current step data - only get data relevant to current step
    const currentData = form.getValues();
    const stepSpecificData = getStepSpecificData(currentData, currentStep);

    updateWizardData(stepSpecificData);

    // Auto-save when moving between steps in edit mode (silent, no toast)
    if (mode === 'edit' && hackathonId) {
      try {
        const dataToSave = {
          ...wizardData,
          [currentStep]: stepSpecificData,
        };
        console.log('Save Debug:', {
          currentStep,
          stepSpecificData,
          fullDataToSave: dataToSave
        });
        await apiClient.hackathons.update(hackathonId, dataToSave);
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }

    // Validate if moving forward
    const targetStepIndex = WIZARD_STEPS.findIndex(s => s.id === step);
    if (targetStepIndex > currentStepIndex) {
      const isValid = await validateCurrentStep();
      if (!isValid) {
        toast.error('Please fix the errors before proceeding');
        return;
      }
    }

    setCurrentStep(step);

    // Mark previous steps as completed
    if (targetStepIndex > currentStepIndex) {
      setCompletedSteps(prev => {
        const updated = [...prev];
        if (!updated.includes(currentStep)) {
          updated.push(currentStep);
        }
        return updated;
      });
    }
  };

  const goNext = async () => {
    const isValid = await validateCurrentStep();
    if (!isValid) {
      // Enhanced error debugging
      console.error('Form errors:', errors);
      console.error('Form data:', form.getValues());

      // Get all field errors for debugging
      const fieldErrors = form.formState.errors;
      console.error('Field-specific errors:', fieldErrors);

      // Special debugging for tracks errors
      if (errors && errors.tracks) {
        console.error('🎯 Tracks error details:', {
          rawError: errors.tracks,
          errorType: typeof errors.tracks,
          errorKeys: Object.keys(errors.tracks || {}),
          errorJSON: JSON.stringify(errors.tracks, null, 2)
        });
      }

      toast.error(`Please fix the errors before proceeding. Check step: ${currentStep}`);
      return;
    }

    // Save current step data
    const currentData = form.getValues();
    updateWizardData(currentData);

    // Mark current step as completed
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    // Go to next step
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < WIZARD_STEPS.length) {
      setCurrentStep(WIZARD_STEPS[nextIndex].id);
    }
  };

  const goPrevious = () => {
    const currentData = form.getValues();
    updateWizardData(currentData);

    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(WIZARD_STEPS[prevIndex].id);
    }
  };

  const saveDraft = async () => {
    const currentData = form.getValues();
    const stepSpecificData = getStepSpecificData(currentData, currentStep);

    const allData = {
      ...wizardData,
      [currentStep]: stepSpecificData,
    };

    try {
      setLoading(true);
      const validatedData = HackathonWizardSchema.parse(allData);

      if (mode === 'create') {
        await apiClient.hackathons.create(validatedData);
        clearWizardProgress('hackathon-create');
        toast.success('Hackathon created successfully');
        router.push('/dashboard/hackathons');
      } else if (mode === 'edit' && hackathonId) {
        await apiClient.hackathons.update(hackathonId, allData);
        toast.success('Hackathon updated successfully');
        router.push(`/dashboard/hackathons/${hackathonId}`);
      }
    } catch (error) {
      console.error('Save draft error:', error);
      toast.error('Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const submitWizard = async () => {
    const currentData = form.getValues();
    const stepSpecificData = getStepSpecificData(currentData, currentStep);

    const allData = {
      ...wizardData,
      [currentStep]: stepSpecificData,
    };

    try {
      setLoading(true);
      const validatedData = HackathonWizardSchema.parse(allData);

      if (mode === 'create') {
        await apiClient.hackathons.create(validatedData);
        clearWizardProgress('hackathon-create');
        toast.success('Hackathon created successfully');
        router.push('/dashboard/hackathons');
      } else if (mode === 'edit' && hackathonId) {
        await apiClient.hackathons.update(hackathonId, allData);
        toast.success('Hackathon updated successfully');
        router.push(`/dashboard/hackathons/${hackathonId}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit hackathon');
    } finally {
      setLoading(false);
    }
  };

  const canGoNext = isValid && !loading;
  const canGoPrevious = !isFirstStep && !loading;

  const renderStep = () => {
    const stepProps = {
      data: (wizardData[currentStep] || {}) as any,
      onUpdate: updateWizardData,
      errors,
    };

    switch (currentStep) {
      case 'basicInfo':
        return <BasicInfoStep {...stepProps} />;
      case 'schedule':
        return <ScheduleStep {...stepProps} />;
      case 'settings':
        return <ReviewStep wizardData={wizardData} onUpdate={setWizardData} />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('max-w-4xl mx-auto', className)}>
      <FormProvider {...form}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
                {mode === 'create' ? 'Create New Hackathon' : 'Edit Hackathon'}
              </h1>
              <p className="text-muted-foreground mt-2">
                {mode === 'create'
                  ? 'Set up your hackathon with our step-by-step wizard.'
                  : 'Update your hackathon configuration'}
              </p>
            </div>
            {mode === 'create' && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {autoSaving ? (
                  <>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Auto-saving...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>All changes saved</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <StepIndicator
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={goToStep}
          />
        </div>

        {/* Step Content */}
        <Card className="border-border/50 bg-background/80 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
          <CardContent className="p-8">
            {/* Global Error Display */}
            {errors && Object.keys(errors).length > 0 && (() => {
              // Debug logging for errors
              console.log('Global Error Debug:', {
                rawErrors: errors,
                errorKeys: Object.keys(errors),
                tracksError: errors.tracks,
                tracksErrorType: typeof errors.tracks,
                tracksErrorKeys: errors.tracks ? Object.keys(errors.tracks) : null,
                fullErrorStructure: JSON.stringify(errors, null, 2)
              });

              return (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-red-600 mt-0.5">⚠️</div>
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        Please fix the following errors:
                      </h4>
                      <div className="space-y-1">
                        {Object.entries(errors).map(([key, error]) => {
                          const errorMessage = extractErrorMessage(error);

                          return (
                            <div key={key} className="text-sm text-red-700">
                              • <strong>{key}:</strong> {errorMessage}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <WizardNavigation
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          canGoNext={canGoNext}
          canGoPrevious={canGoPrevious}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          isLoading={loading}
          isDirty={isDirty}
          errors={errors}
          onNext={goNext}
          onPrevious={goPrevious}
          onSave={saveDraft}
          onSubmit={submitWizard}
          className="mt-8"
        />
      </FormProvider>
    </div>
  );
}