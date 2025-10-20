'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Github, Globe, Video, FileText, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';
import { ProjectCreateSchema } from '@/lib/validations/project';
import type { ProjectCreate } from '@/lib/validations/project';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface Track {
  id: string;
  name: string;
  description?: string;
  prize?: string;
}

interface IndividualUploadFormProps {
  hackathonId: string;
  tracks: Track[];
  onSuccess?: (project: any) => void;
  onCancel?: () => void;
}

export function IndividualUploadForm({
  hackathonId,
  tracks,
  onSuccess,
  onCancel
}: IndividualUploadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<ProjectCreate>({
    resolver: zodResolver(ProjectCreateSchema),
    defaultValues: {
      hackathonId,
      name: '',
      description: '',
      teamName: '',
      teamMembers: [],
      githubUrl: '',
      demoUrl: '',
      videoUrl: '',
      presentationUrl: '',
      trackId: tracks.length > 0 ? tracks[0].id : '',
    },
    mode: 'onChange'
  });

  const { fields: teamMemberFields, append: appendTeamMember, remove: removeTeamMember } = useFieldArray({
    control,
    name: 'teamMembers'
  });

  const selectedTrackId = watch('trackId');
  const selectedTrack = tracks.find(t => t.id === selectedTrackId);


  const onSubmit = async (data: ProjectCreate) => {
    setIsSubmitting(true);
    try {
      const response = await fetchBackend(`/hackathons/${hackathonId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      toast.success('Project created successfully!');
      onSuccess?.(result.data);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  {...register('name')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  placeholder="Enter team name"
                  {...register('teamName')}
                  className={errors.teamName ? 'border-red-500' : ''}
                />
                {errors.teamName && (
                  <p className="text-sm text-red-600">{errors.teamName.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail (minimum 50 characters)"
                rows={4}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {watch('description')?.length || 0}/2000 characters
              </p>
            </div>

            {/* Track Selection */}
            <div className="space-y-2">
              <Label htmlFor="trackId">Competition Track *</Label>
              <select
                id="trackId"
                {...register('trackId')}
                className={`w-full px-3 py-2 border rounded-md bg-background ${
                  errors.trackId ? 'border-red-500' : 'border-input'
                }`}
              >
                {tracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.name} {track.prize && `- ${track.prize}`}
                  </option>
                ))}
              </select>
              {errors.trackId && (
                <p className="text-sm text-red-600">{errors.trackId.message}</p>
              )}
              {selectedTrack?.description && (
                <p className="text-sm text-muted-foreground">{selectedTrack.description}</p>
              )}
            </div>

            {/* Team Members */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Team Members
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTeamMember({ name: '' })}
                  disabled={teamMemberFields.length >= 10}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              </div>

              <div className="space-y-3">
                {teamMemberFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder={`Team member ${index + 1} name`}
                      {...register(`teamMembers.${index}.name`)}
                      className={errors.teamMembers?.[index]?.name ? 'border-red-500' : ''}
                    />
                    {
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    }
                  </div>
                ))}
              </div>
              {errors.teamMembers && (
                <p className="text-sm text-red-600">
                  {typeof errors.teamMembers.message === 'string'
                    ? errors.teamMembers.message
                    : 'Please fill in all team member names'}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {teamMemberFields.length}/10 members (optional)
              </p>
            </div>


            {/* URLs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Project Links</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="githubUrl" className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub Repository *
                  </Label>
                  <Input
                    id="githubUrl"
                    placeholder="https://github.com/username/repository"
                    {...register('githubUrl')}
                    className={errors.githubUrl ? 'border-red-500' : ''}
                  />
                  {errors.githubUrl && (
                    <p className="text-sm text-red-600">{errors.githubUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="demoUrl" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Demo URL
                  </Label>
                  <Input
                    id="demoUrl"
                    placeholder="https://your-demo.com"
                    {...register('demoUrl')}
                    className={errors.demoUrl ? 'border-red-500' : ''}
                  />
                  {errors.demoUrl && (
                    <p className="text-sm text-red-600">{errors.demoUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Video URL
                  </Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    {...register('videoUrl')}
                    className={errors.videoUrl ? 'border-red-500' : ''}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-red-600">{errors.videoUrl.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presentationUrl" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Presentation URL
                  </Label>
                  <Input
                    id="presentationUrl"
                    placeholder="https://docs.google.com/presentation/..."
                    {...register('presentationUrl')}
                    className={errors.presentationUrl ? 'border-red-500' : ''}
                  />
                  {errors.presentationUrl && (
                    <p className="text-sm text-red-600">{errors.presentationUrl.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6 border-t">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}