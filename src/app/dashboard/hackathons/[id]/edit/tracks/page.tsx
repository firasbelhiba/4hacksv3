'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import {
  ArrowLeft,
  Plus,
  Save,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import type { Track } from '@/lib/validations/hackathon';

import { fetchBackend } from '@/lib/api/fetch-backend';
type TrackWithProjectCount = Track & {
  _count: { projects: number };
  createdAt: Date;
  updatedAt: Date;
  hackathonId: string;
};

export default function TracksEditPage() {
  const params = useParams();
  const router = useRouter();
  const hackathonId = params.id as string;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [hackathon, setHackathon] = useState<any>(null);
  const [hackathonLoading, setHackathonLoading] = useState(true);
  const [hackathonError, setHackathonError] = useState<string | null>(null);

  // Fetch hackathon data
  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        setHackathonLoading(true);
        const result = await apiClient.hackathons.get(hackathonId);
        setHackathon(result);
      } catch (err) {
        setHackathonError(err instanceof Error ? err.message : 'Failed to load hackathon');
      } finally {
        setHackathonLoading(false);
      }
    };

    if (hackathonId) {
      fetchHackathon();
    }
  }, [hackathonId]);

  // Load tracks
  useEffect(() => {
    const loadTracks = async () => {
      try {
        setIsLoading(true);
        const result = await apiClient.hackathons.tracks.list(hackathonId);
        // Convert to simple Track format for editing
        const simpleTracks: Track[] = result.map((track: any) => ({
          id: track.id,
          name: track.name,
          description: track.description,
          prize: track.prize,
          order: track.order,
          eligibilityCriteria: track.eligibilityCriteria?.criteria || [],
        }));
        setTracks(simpleTracks);
      } catch (error) {
        console.error('Error loading tracks:', error);
        toast.error('Failed to load tracks');
      } finally {
        setIsLoading(false);
      }
    };

    if (hackathonId) {
      loadTracks();
    }
  }, [hackathonId]);

  // Fast save using the new API
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Update each track individually
      for (const track of tracks) {
        if (track.id) {
          await apiClient.hackathons.tracks.update(hackathonId, track.id, track);
        } else {
          await apiClient.hackathons.tracks.create(hackathonId, track);
        }
      }

      setHasChanges(false);
      toast.success('Tracks saved successfully!');
    } catch (error) {
      toast.error(`Failed to save tracks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTrackUpdate = (index: number, updatedTrack: Track) => {
    const newTracks = [...tracks];
    newTracks[index] = updatedTrack;
    setTracks(newTracks);
    setHasChanges(true);
  };

  const handleAddTrack = () => {
    const newTrack: Track = {
      name: '',
      description: '',
      prize: '',
      order: tracks.length,
      eligibilityCriteria: [],
    };
    setTracks([...tracks, newTrack]);
    setHasChanges(true);
  };

  const handleRemoveTrack = (index: number) => {
    if (tracks.length === 1) {
      toast.error('You must have at least one track');
      return;
    }

    const newTracks = tracks.filter((_, i) => i !== index);
    setTracks(newTracks);
    setHasChanges(true);
  };

  const handleBackToHackathon = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        router.push(`/dashboard/hackathons/${hackathonId}`);
      }
    } else {
      router.push(`/dashboard/hackathons/${hackathonId}`);
    }
  };

  if (hackathonError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Error Loading Hackathon</h3>
          <p className="text-muted-foreground">{hackathonError}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackToHackathon}
          className="p-1 h-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Hackathon
        </Button>
        <span>•</span>
        <span>Edit Tracks</span>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Edit Tracks"
        description={`Manage tracks for ${hackathon?.name || 'your hackathon'}`}
        actions={
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                Unsaved changes
              </Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      {/* Warning about fast saves */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/10">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 text-blue-600 mt-0.5">ℹ️</div>
            <div>
              <h4 className="font-semibold text-blue-800">Fast Track Editing</h4>
              <p className="text-sm text-blue-700 mt-1">
                This page bypasses the wizard for instant track updates. Changes are saved directly to the database when you click "Save Changes".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tracks Editor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tracks ({tracks.length}/10)</CardTitle>
            <Button
              onClick={handleAddTrack}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Track
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-muted rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : tracks.length > 0 ? (
            tracks.map((track, index) => (
              <TrackEditCard
                key={index}
                track={track}
                index={index}
                onUpdate={(updatedTrack) => handleTrackUpdate(index, updatedTrack)}
                onRemove={() => handleRemoveTrack(index)}
                canRemove={tracks.length > 1}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No tracks yet. Add your first track to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save reminder at bottom */}
      {hasChanges && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/10 sticky bottom-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  You have unsaved changes
                </span>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Simple inline track editor component
function TrackEditCard({
  track,
  index,
  onUpdate,
  onRemove,
  canRemove,
}: {
  track: Track;
  index: number;
  onUpdate: (track: Track) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const handleFieldChange = (field: keyof Track, value: any) => {
    onUpdate({
      ...track,
      [field]: value,
    });
  };

  return (
    <Card className="border-border/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-muted-foreground">
            Track {index + 1}
          </h4>
          {canRemove && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRemove}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Track Name *</label>
            <input
              type="text"
              value={track.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter track name"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Prize</label>
            <input
              type="text"
              value={track.prize || ''}
              onChange={(e) => handleFieldChange('prize', e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., $1000, Trophy, etc."
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description *</label>
          <textarea
            value={track.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Describe this track's theme, requirements, or focus area"
          />
        </div>
      </CardContent>
    </Card>
  );
}