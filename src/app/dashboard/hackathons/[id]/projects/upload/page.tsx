'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileText, Users, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndividualUploadForm } from '@/components/projects/individual-upload-form';
import { CSVBulkUpload } from '@/components/projects/csv-bulk-upload';
import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface HackathonData {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  organizationName: string;
  tracks: Array<{
    id: string;
    name: string;
    description?: string;
    prize?: string;
    order: number;
  }>;
  _count: {
    projects: number;
    tracks: number;
  };
  settings: {
    requireGithubRepo: boolean;
    isPublic: boolean;
  };
}


export default function ProjectUploadPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<HackathonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('individual');

  const hackathonId = params.id as string;

  useEffect(() => {
    const fetchHackathon = async () => {
      try {
        setLoading(true);

        const response = await fetchBackend(`/hackathons/${hackathonId}`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('Hackathon not found');
            return;
          }
          if (response.status === 403) {
            setError('You do not have permission to access this hackathon');
            return;
          }
          throw new Error('Failed to fetch hackathon');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch hackathon');
        }

        setHackathon(data.data);
      } catch (err) {
        console.error('Error fetching hackathon:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        toast.error('Failed to load hackathon');
      } finally {
        setLoading(false);
      }
    };

    if (hackathonId) {
      fetchHackathon();
    }
  }, [hackathonId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading hackathon...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto border-red-200 bg-red-50">
          <CardContent className="text-center py-12">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Hackathon</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={() => router.push('/dashboard/hackathons')}
              variant="outline"
            >
              Back to Hackathons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No hackathon data found</p>
            <Button
              onClick={() => router.push('/dashboard/hackathons')}
              className="mt-4"
            >
              Back to Hackathons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasNecessaryTracks = hackathon.tracks && hackathon.tracks.length > 0;
  // Check if uploads are allowed (based on tracks availability)
  const canUpload = hasNecessaryTracks;

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href={`/dashboard/hackathons/${hackathon.id}`}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {hackathon.name}
        </Link>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Upload Projects"
        description={`Submit projects for ${hackathon.name}`}
        badge={{
          text: hackathon.status,
          variant: hackathon.status === 'ACTIVE' ? 'default' : 'secondary'
        }}
        stats={[
          {
            label: 'Available Tracks',
            value: hackathon.tracks?.length || 0,
          },
          {
            label: 'Current Projects',
            value: hackathon._count?.projects || 0,
          },
          {
            label: 'Upload Status',
            value: canUpload ? 'Open' : 'Closed',
          },
        ]}
      />

      {/* Upload Status Banner */}
      {!canUpload && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Project Uploads Currently Closed
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-200 mt-1">
                  This hackathon doesn't have any tracks configured yet. Tracks are required before projects can be submitted.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Tracks Warning */}
      {!hasNecessaryTracks && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-100">
                  No Tracks Available
                </h3>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  This hackathon doesn't have any tracks configured. Projects need to be assigned to a track.
                </p>
                <Link href={`/dashboard/hackathons/${hackathon.id}/edit/tracks`}>
                  <Button size="sm" className="mt-2">
                    Configure Tracks
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hackathon Context Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Hackathon Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">Organization</h4>
              <p className="text-sm font-semibold">{hackathon.organizationName}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">GitHub Required</h4>
              <p className="text-sm font-semibold">
                {hackathon.settings.requireGithubRepo ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {hackathon.tracks && hackathon.tracks.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Available Tracks</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {hackathon.tracks.map((track) => (
                  <div key={track.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-sm">{track.name}</h5>
                      {track.prize && (
                        <Badge variant="outline" className="text-xs">
                          {track.prize}
                        </Badge>
                      )}
                    </div>
                    {track.description && (
                      <p className="text-xs text-muted-foreground">{track.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Methods */}
      {canUpload && hasNecessaryTracks && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Choose Upload Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Individual Upload
                </TabsTrigger>
                <TabsTrigger value="bulk" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Bulk CSV Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="mt-6">
                <IndividualUploadForm
                  hackathonId={hackathon.id}
                  tracks={hackathon.tracks}
                  onSuccess={(project) => {
                    toast.success(`Project "${project.name}" created successfully!`);
                    router.push(`/dashboard/hackathons/${hackathon.id}`);
                  }}
                />
              </TabsContent>

              <TabsContent value="bulk" className="mt-6">
                <CSVBulkUpload
                  hackathonId={hackathon.id}
                  tracks={hackathon.tracks}
                  onSuccess={(result) => {
                    toast.success(`Successfully uploaded ${result.summary.successful} projects!`);
                    router.push(`/dashboard/hackathons/${hackathon.id}`);
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Help & Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Project Requirements</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Project name must be unique within this hackathon</li>
              <li>Description must be at least 50 characters</li>
              <li>Team members are optional (can submit solo projects)</li>
              {hackathon.settings.requireGithubRepo && (
                <li>Valid GitHub repository URL is required</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Supported Data</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Team members: Names separated by commas</li>
              <li>Optional: Demo URL, video URL, presentation URL</li>
              <li>Maximum 10 team members per project</li>
            </ul>
          </div>

          {activeTab === 'bulk' && (
            <div>
              <h4 className="font-medium mb-2">CSV Format</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Maximum 500 projects per upload</li>
                <li>Use provided CSV template for best results</li>
                <li>Ensure track names match exactly</li>
                <li>Validation will check for duplicates and errors</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}