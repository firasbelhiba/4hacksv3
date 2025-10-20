'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { formatDateForDisplay } from '@/lib/form-utils';
import type { HackathonWizard, Settings } from '@/lib/validations/hackathon';
import { cn } from '@/lib/utils';

interface ReviewStepProps {
  wizardData: Partial<HackathonWizard>;
  onUpdate: (data: Partial<HackathonWizard>) => void;
}

export function ReviewStep({ wizardData, onUpdate }: ReviewStepProps) {
  const [settings, setSettings] = useState<Settings>(wizardData.settings || {
    isPublic: true,
    requireGithubRepo: true,
    requireDemoVideo: false,
    autoStartEvaluation: true,
    notifyParticipants: true,
  });

  const updateSetting = (key: keyof Settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onUpdate({ ...wizardData, settings: newSettings });
  };

  const { basicInfo, schedule, tracks } = wizardData;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Settings & Review
        </h2>
        <p className="text-muted-foreground">
          Configure final settings and review your hackathon before creation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Hackathon Settings</h3>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-6">
              {/* Public Hackathon */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Public Hackathon</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow anyone to view and register
                  </p>
                </div>
                <Switch
                  checked={settings.isPublic}
                  onCheckedChange={(checked) => updateSetting('isPublic', checked)}
                />
              </div>

              <Separator />


              {/* Require GitHub */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Require GitHub Repository</Label>
                  <p className="text-xs text-muted-foreground">
                    Mandatory source code repository
                  </p>
                </div>
                <Switch
                  checked={settings.requireGithubRepo}
                  onCheckedChange={(checked) => updateSetting('requireGithubRepo', checked)}
                />
              </div>

              <Separator />

              {/* Require Demo Video */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Require Demo Video</Label>
                  <p className="text-xs text-muted-foreground">
                    Mandatory project demonstration
                  </p>
                </div>
                <Switch
                  checked={settings.requireDemoVideo}
                  onCheckedChange={(checked) => updateSetting('requireDemoVideo', checked)}
                />
              </div>

              <Separator />

              {/* Auto Start Evaluation */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Auto-Start Evaluation</Label>
                  <p className="text-xs text-muted-foreground">
                    Begin AI evaluation after deadline
                  </p>
                </div>
                <Switch
                  checked={settings.autoStartEvaluation}
                  onCheckedChange={(checked) => updateSetting('autoStartEvaluation', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-foreground">Review Your Hackathon</h3>

          {/* Overview Card */}
          <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-purple-800 dark:text-purple-200">
                    {basicInfo?.name || 'Hackathon Name'}
                  </CardTitle>
                  <p className="text-purple-600 dark:text-purple-300 text-sm mt-1">
                    {basicInfo?.organizationName || 'Organization'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3 text-sm">
                {/* Dates */}
                {schedule?.startDate && schedule?.endDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-300">Duration:</span>
                    <span className="text-purple-800 dark:text-purple-200 font-medium">
                      {formatDateForDisplay(schedule.startDate, 'MMM d')} - {formatDateForDisplay(schedule.endDate, 'MMM d, yyyy')}
                    </span>
                  </div>
                )}

                {/* Prize Pool */}
                {basicInfo?.prizePool && (
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700 dark:text-purple-300">Prize Pool:</span>
                    <span className="text-purple-800 dark:text-purple-200 font-medium">
                      {basicInfo.prizePool}
                    </span>
                  </div>
                )}

                {/* Tracks */}
                <div className="flex items-center justify-between">
                  <span className="text-purple-700 dark:text-purple-300">Tracks:</span>
                  <span className="text-purple-800 dark:text-purple-200 font-medium">
                    {tracks?.tracks?.length || 0} tracks
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="space-y-4">
            {/* Tracks Summary */}
            {tracks?.tracks && (tracks.tracks?.length || 0) > 0 && (
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tracks ({tracks.tracks?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {tracks.tracks.slice(0, 3).map((track, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{track.name}</span>
                        {track.prize && (
                          <Badge variant="outline" className="text-xs">
                            {track.prize}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {(tracks.tracks?.length || 0) > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{(tracks.tracks?.length || 0) - 3} more tracks
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Final Notes */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            🎉 Ready to Launch!
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Your hackathon is configured and ready to be created. You can always edit these settings later from the hackathon management dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}