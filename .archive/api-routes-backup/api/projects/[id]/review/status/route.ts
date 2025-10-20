import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { reviewStatusService } from '@/lib/services/review-status';
import type { ApiResponse } from '@/types/database';

// GET /api/projects/[id]/review/status - Get combined review status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Review status request unauthorized for project:', params.id);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = params.id;
    console.log('Fetching review status for project:', projectId);

    // Get the combined review status
    const reviewStatus = await reviewStatusService.getProjectReviewStatus(projectId);
    console.log('Review status retrieved:', {
      hasAnyReviews: reviewStatus.hasAnyReviews,
      isFullyReviewed: reviewStatus.isFullyReviewed,
      codeQuality: reviewStatus.codeQuality.status,
      coherence: reviewStatus.coherence.status,
      innovation: reviewStatus.innovation.status,
      hedera: {
        status: reviewStatus.hedera.status,
        hederaUsageScore: reviewStatus.hedera.hederaUsageScore,
        technologyCategory: reviewStatus.hedera.technologyCategory
      }
    });

    const response: ApiResponse = {
      success: true,
      data: reviewStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching review status for project:', params.id, error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}