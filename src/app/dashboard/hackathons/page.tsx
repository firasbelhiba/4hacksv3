'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, Trophy, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/page-header';
import { apiClient } from '@/lib/api/client';
import { formatDateForDisplay } from '@/lib/form-utils';


import { fetchBackend } from '@/lib/api/fetch-backend';
export default function HackathonsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchHackathons = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiClient.hackathons.list({
          page: currentPage,
          limit: 10,
        });
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hackathons');
      } finally {
        setLoading(false);
      }
    };

    fetchHackathons();
  }, [currentPage]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search in backend API
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Hackathons"
        description="Manage your hackathon events and competitions"
        stats={data?.pagination ? [
          {
            label: 'Total Hackathons',
            value: data.pagination?.totalCount || 0,
          },
          {
            label: 'With Tracks',
            value: data.data?.filter((h: any) => h._count.tracks > 0).length || 0,
          },
          {
            label: 'No Tracks',
            value: data.data?.filter((h: any) => h._count.tracks === 0).length || 0,
          },
        ] : undefined}
      >
        <Link href="/dashboard/hackathons/new">
          <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Hackathon
          </Button>
        </Link>
      </PageHeader>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search hackathons..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Hackathons List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((hackathon) => (
            <Card key={hackathon.id} className="group hover:shadow-lg transition-all duration-200 border-border/50 bg-background/80 backdrop-blur-xl h-full flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-purple-600 transition-colors">
                      {hackathon.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {hackathon.organizationName}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 flex-1 flex flex-col">
                {/* Description */}
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {hackathon.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <p className="font-medium">
                      {formatDateForDisplay(hackathon.startDate, 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prize Pool:</span>
                    <p className="font-medium">
                      {hackathon.prizePool || 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{hackathon._count?.tracks || 0} tracks</span>
                  <span>{hackathon._count?.projects || 0} projects</span>
                  <span>Created {formatDateForDisplay(hackathon.createdAt, 'MMM d')}</span>
                </div>

                <div className="flex-1"></div>
                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/dashboard/hackathons/${hackathon.id}`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/dashboard/hackathons/${hackathon.id}/projects`}>
                    <Button variant="outline" size="sm" className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Projects
                    </Button>
                  </Link>
                  <Link href={`/dashboard/hackathons/${hackathon.id}/edit`}>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/50 rounded-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-purple-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                No hackathons yet
              </h3>
              <p className="text-muted-foreground max-w-md">
                Get started by creating your first hackathon event. Our wizard will guide you through the setup process.
              </p>
            </div>
            <Link href="/dashboard/hackathons/new">
              <Button className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Hackathon
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.pagination ? data.pagination.pageSize * (data.pagination.currentPage - 1) + 1 : 0} to{' '}
            {data.pagination ? Math.min(data.pagination.pageSize * data.pagination.currentPage, data.pagination.totalCount) : 0} of{' '}
            {data.pagination?.totalCount || 0} hackathons
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination?.hasPreviousPage}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!data.pagination?.hasNextPage}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}