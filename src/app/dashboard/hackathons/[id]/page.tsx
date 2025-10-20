'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, Edit, Trophy, Calendar, Users, Award, Settings, Play, Pause, CheckCircle, Clock, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PageHeader } from '@/components/shared/page-header';
import { toast } from 'react-hot-toast';
import { formatDateForDisplay } from '@/lib/form-utils';



import { fetchBackend } from '@/lib/api/fetch-backend';
export default function HackathonDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathon, setHackathon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            setError('You do not have permission to view this hackathon');
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

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={hackathon.name}
        description={hackathon.description}
        stats={[
          {
            label: 'Tracks',
            value: hackathon._count?.tracks || 0,
          },
          {
            label: 'Projects',
            value: hackathon._count?.projects || 0,
          },
        ]}
      >
        <div className="flex gap-2">
          <Link href={`/dashboard/hackathons/${hackathon.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Link href={`/dashboard/hackathons/${hackathon.id}/edit/tracks`}>
            <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
              <Trophy className="w-4 h-4 mr-2" />
              Edit Tracks
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Overview
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Organization</h4>
                  <p className="text-lg font-semibold">{hackathon.organizationName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Prize Pool</h4>
                  <p className="text-lg font-semibold">{hackathon.prizePool || 'TBD'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Start Date</h4>
                  <p className="text-lg font-semibold">
                    {formatDateForDisplay(hackathon.startDate, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">End Date</h4>
                  <p className="text-lg font-semibold">
                    {formatDateForDisplay(hackathon.endDate, 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>

              {hackathon.bannerImage && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Banner</h4>
                  <img
                    src={hackathon.bannerImage}
                    alt={hackathon.name}
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracks Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Tracks ({hackathon.tracks?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hackathon.tracks && hackathon.tracks.length > 0 ? (
                <div className="space-y-3">
                  {hackathon.tracks.map((track: any) => (
                    <div key={track.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{track.name}</h4>
                        {track.prize && (
                          <Badge variant="outline">
                            <Award className="w-3 h-3 mr-1" />
                            {track.prize}
                          </Badge>
                        )}
                      </div>
                      {track.description && (
                        <p className="text-sm text-muted-foreground mb-2">{track.description}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{track._count?.projects || 0} projects</span>
                        <span>Order: {track.order}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tracks defined yet</p>
                  <Link href={`/dashboard/hackathons/${hackathon.id}/edit/tracks`}>
                    <Button className="mt-4" size="sm">
                      Add Tracks
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evaluation Criteria Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Evaluation Criteria ({hackathon.evaluationCriteria?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hackathon.evaluationCriteria && hackathon.evaluationCriteria.length > 0 ? (
                <div className="space-y-3">
                  {hackathon.evaluationCriteria.map((criterion: any) => (
                    <div key={criterion.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{criterion.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{criterion.category}</Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            {criterion.weight}%
                          </Badge>
                        </div>
                      </div>
                      {criterion.description && (
                        <p className="text-sm text-muted-foreground">{criterion.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No evaluation criteria defined yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{hackathon._count?.projects || 0}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{hackathon._count?.tracks || 0}</div>
                <div className="text-sm text-muted-foreground">Competition Tracks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {hackathon.evaluationCriteria?.length || 0}
                </div>
                <div className="text-sm text-muted-foreground">Evaluation Criteria</div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Event Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Public Event</span>
                <Badge variant={hackathon.settings?.isPublic ? "default" : "secondary"}>
                  {hackathon.settings?.isPublic ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">GitHub Required</span>
                <Badge variant={hackathon.settings?.requireGithubRepo ? "default" : "secondary"}>
                  {hackathon.settings?.requireGithubRepo ? "Yes" : "No"}
                </Badge>
              </div>
              {hackathon.settings?.registrationDeadline && (
                <div>
                  <span className="text-sm text-muted-foreground">Registration Deadline</span>
                  <p className="text-sm font-medium">
                    {formatDateForDisplay(hackathon.settings.registrationDeadline, 'MMM d, yyyy')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/dashboard/hackathons/${hackathon.id}/projects/upload`} className="block">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Projects
                </Button>
              </Link>
              <Link href={`/dashboard/hackathons/${hackathon.id}/edit/tracks`} className="block">
                <Button className="w-full" variant="outline">
                  <Trophy className="w-4 h-4 mr-2" />
                  Edit Tracks
                </Button>
              </Link>
              <Link href={`/dashboard/hackathons/${hackathon.id}/edit`} className="block">
                <Button className="w-full" variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </Link>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push('/dashboard/hackathons')}
              >
                <Eye className="w-4 h-4 mr-2" />
                All Hackathons
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}