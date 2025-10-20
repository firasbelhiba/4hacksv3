'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { formatDateForInput } from '@/lib/form-utils';
import type { Schedule } from '@/lib/validations/hackathon';
import { cn } from '@/lib/utils';

interface ScheduleStepProps {
  data: Schedule;
  onUpdate: (data: Schedule) => void;
  errors?: Record<string, any>;
}

export function ScheduleStep({ data, onUpdate, errors }: ScheduleStepProps) {
  const { setValue, watch, formState: { errors: formErrors } } = useFormContext<Schedule>();

  // Watch all form values for real-time updates
  const startDate = watch('startDate', data.startDate);
  const endDate = watch('endDate', data.endDate);
  const timezone = watch('timezone', data.timezone);
  const registrationDeadline = watch('registrationDeadline', data.registrationDeadline);
  const evaluationPeriodEnd = watch('evaluationPeriodEnd', data.evaluationPeriodEnd);
  const resultAnnouncementDate = watch('resultAnnouncementDate', data.resultAnnouncementDate);

  // Handle date field changes
  const handleDateChange = (field: keyof Schedule, value: string) => {
    const dateValue = value ? new Date(value) : undefined;
    setValue(field, dateValue as any, { shouldValidate: true });
    onUpdate({ ...data, [field]: dateValue });
  };

  const handleTextChange = (field: keyof Schedule, value: string) => {
    setValue(field, value as any, { shouldValidate: true });
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Schedule & Timeline
        </h2>
        <p className="text-muted-foreground">
          Set up your hackathon dates and important deadlines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Core Dates */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Core Event Dates</h3>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-medium">
              Start Date & Time *
            </Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate ? formatDateForInput(startDate) : ''}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              className={cn(
                'transition-all duration-200',
                formErrors?.startDate && 'border-red-500 focus:ring-red-500'
              )}
            />
            {formErrors?.startDate && (
              <p className="text-sm text-red-500">{formErrors.startDate.message}</p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-medium">
              End Date & Time *
            </Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate ? formatDateForInput(endDate) : ''}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              className={cn(
                'transition-all duration-200',
                formErrors?.endDate && 'border-red-500 focus:ring-red-500'
              )}
            />
            {formErrors?.endDate && (
              <p className="text-sm text-red-500">{formErrors.endDate.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium">
              Timezone
            </Label>
            <select
              id="timezone"
              value={timezone || 'UTC'}
              onChange={(e) => handleTextChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>

        {/* Optional Dates */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Optional Deadlines</h3>

          {/* Registration Deadline */}
          <div className="space-y-2">
            <Label htmlFor="registrationDeadline" className="text-sm font-medium">
              Registration Deadline
            </Label>
            <Input
              id="registrationDeadline"
              type="datetime-local"
              value={registrationDeadline ? formatDateForInput(registrationDeadline) : ''}
              onChange={(e) => handleDateChange('registrationDeadline', e.target.value)}
              className="transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">
              When participant registration closes
            </p>
          </div>

          {/* Evaluation Period End */}
          <div className="space-y-2">
            <Label htmlFor="evaluationPeriodEnd" className="text-sm font-medium">
              Evaluation Period End
            </Label>
            <Input
              id="evaluationPeriodEnd"
              type="datetime-local"
              value={evaluationPeriodEnd ? formatDateForInput(evaluationPeriodEnd) : ''}
              onChange={(e) => handleDateChange('evaluationPeriodEnd', e.target.value)}
              className="transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">
              When project evaluation must be completed
            </p>
          </div>

          {/* Results Announcement */}
          <div className="space-y-2">
            <Label htmlFor="resultAnnouncementDate" className="text-sm font-medium">
              Results Announcement
            </Label>
            <Input
              id="resultAnnouncementDate"
              type="datetime-local"
              value={resultAnnouncementDate ? formatDateForInput(resultAnnouncementDate) : ''}
              onChange={(e) => handleDateChange('resultAnnouncementDate', e.target.value)}
              className="transition-all duration-200"
            />
            <p className="text-xs text-muted-foreground">
              When winners will be announced
            </p>
          </div>
        </div>
      </div>

      {/* Timeline Preview */}
      <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-4">
            📅 Timeline Preview
          </h4>
          <div className="space-y-2 text-sm text-purple-700 dark:text-purple-300">
            {registrationDeadline && (
              <div>• Registration closes: {new Date(registrationDeadline).toLocaleDateString()}</div>
            )}
            {startDate && (
              <div>• Hackathon starts: {new Date(startDate).toLocaleDateString()}</div>
            )}
            {endDate && (
              <div>• Submissions end: {new Date(endDate).toLocaleDateString()}</div>
            )}
            {evaluationPeriodEnd && (
              <div>• Evaluation ends: {new Date(evaluationPeriodEnd).toLocaleDateString()}</div>
            )}
            {resultAnnouncementDate && (
              <div>• Results announced: {new Date(resultAnnouncementDate).toLocaleDateString()}</div>
            )}
            {!startDate && !endDate && (
              <div className="text-muted-foreground">Select dates above to see your timeline</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}