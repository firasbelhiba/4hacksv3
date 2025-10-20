'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { HackathonWizard } from '@/components/hackathons/wizard/hackathon-wizard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
export default function EditHackathonPage() {
  const params = useParams();
  const router = useRouter();
  const [hackathonData, setHackathonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hackathonId = params.id as string;

  useEffect(() => {
    const fetchHackathonData = async () => {
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
            setError('You do not have permission to edit this hackathon');
            return;
          }
          throw new Error('Failed to fetch hackathon');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch hackathon');
        }

        // Transform the data to match wizard format
        const transformedData = {
          basicInfo: {
            name: data.data.name,
            slug: data.data.slug,
            description: data.data.description,
            organizationName: data.data.organizationName,
            prizePool: data.data.prizePool,
            bannerImage: data.data.bannerImage,
          },
          schedule: {
            startDate: new Date(data.data.startDate),
            endDate: new Date(data.data.endDate),
            registrationDeadline: data.data.settings?.registrationDeadline
              ? new Date(data.data.settings.registrationDeadline)
              : undefined,
            evaluationPeriodEnd: data.data.settings?.evaluationPeriodEnd
              ? new Date(data.data.settings.evaluationPeriodEnd)
              : undefined,
            resultAnnouncementDate: data.data.settings?.resultAnnouncementDate
              ? new Date(data.data.settings.resultAnnouncementDate)
              : undefined,
            timezone: data.data.settings?.timezone || 'UTC',
          },
          tracks: {
            tracks: data.data.tracks || [],
          },
          evaluationCriteria: {
            criteria: data.data.evaluationCriteria || [],
          },
          settings: {
            isPublic: data.data.settings?.isPublic ?? true,
            requireGithubRepo: data.data.settings?.requireGithubRepo ?? true,
            requireDemoVideo: data.data.settings?.requireDemoVideo ?? false,
            autoStartEvaluation: data.data.settings?.autoStartEvaluation ?? true,
            notifyParticipants: data.data.settings?.notifyParticipants ?? true,
          },
        };

        setHackathonData(transformedData);
      } catch (err) {
        console.error('Error fetching hackathon:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        toast.error('Failed to load hackathon data');
      } finally {
        setLoading(false);
      }
    };

    if (hackathonId) {
      fetchHackathonData();
    }
  }, [hackathonId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-muted-foreground">Loading hackathon data...</p>
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
            <button
              onClick={() => router.push('/dashboard/hackathons')}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Back to Hackathons
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hackathonData) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No hackathon data found</p>
            <button
              onClick={() => router.push('/dashboard/hackathons')}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Back to Hackathons
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <HackathonWizard
        mode="edit"
        initialData={hackathonData}
        hackathonId={hackathonId}
      />
    </div>
  );
}