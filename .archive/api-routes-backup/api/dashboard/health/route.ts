import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { healthCheck } from '@/lib/db';
import type { ApiResponse } from '@/types/database';
import type { SystemHealth } from '@/lib/services/dashboard-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check database health
    const dbHealth = await healthCheck();

    // Check AI service health (simplified check)
    const aiHealth = await checkAIHealth();

    // Check storage health (simplified)
    const storageHealth = getStorageHealth();

    const systemHealth: SystemHealth = {
      database: {
        status: dbHealth.healthy ? 'healthy' : 'down',
        latency: dbHealth.latency || 0,
        lastChecked: new Date().toISOString(),
      },
      ai: {
        status: aiHealth.healthy ? 'healthy' : 'degraded',
        responseTime: aiHealth.responseTime,
        lastChecked: new Date().toISOString(),
      },
      storage: {
        status: storageHealth.healthy ? 'healthy' : 'degraded',
        usage: storageHealth.usage,
        available: storageHealth.available,
      },
    };

    const response: ApiResponse<SystemHealth> = {
      success: true,
      data: systemHealth,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions

async function checkAIHealth(): Promise<{ healthy: boolean; responseTime: number }> {
  try {
    // Simple check - in a real app, you might ping the AI service
    const start = Date.now();

    // Simulate AI service check
    await new Promise(resolve => setTimeout(resolve, 50));

    const responseTime = Date.now() - start;

    return {
      healthy: true,
      responseTime,
    };
  } catch (error) {
    console.error('AI health check failed:', error);
    return {
      healthy: false,
      responseTime: 0,
    };
  }
}

function getStorageHealth(): { healthy: boolean; usage: number; available: number } {
  try {
    // In a real app, you would check actual storage metrics
    // This is a simplified mock implementation

    // Simulate storage usage (70% used, 30% available)
    const usage = 70;
    const available = 30;

    return {
      healthy: usage < 90, // Consider unhealthy if over 90% used
      usage,
      available,
    };
  } catch (error) {
    console.error('Storage health check failed:', error);
    return {
      healthy: false,
      usage: 0,
      available: 0,
    };
  }
}