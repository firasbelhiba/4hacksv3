import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { aiJuryProgressManager } from '@/lib/ai-jury-progress';

// GET /api/ai-jury/sessions/[id]/live-progress - Server-Sent Events for real-time progress
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sessionId = params.id;

    // Verify session exists and user has access
    const aiJurySession = await prisma.aIJurySession.findFirst({
      where: {
        id: sessionId,
        hackathon: {
          createdById: session.user.id,
        },
      },
    });

    if (!aiJurySession) {
      return NextResponse.json(
        { success: false, error: 'AI jury session not found or access denied' },
        { status: 404 }
      );
    }

    // Create Server-Sent Events stream
    const encoder = new TextEncoder();

    const customReadable = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialMessage = {
          id: Date.now().toString(),
          type: 'connection',
          message: 'Connected to live progress feed',
          timestamp: new Date().toISOString(),
          sessionId: sessionId,
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialMessage)}\n\n`));

        // Send recent events immediately
        const recentEvents = aiJuryProgressManager.getRecentEvents(sessionId, 10);
        recentEvents.forEach(event => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        });

        // Subscribe to real-time progress events
        const unsubscribe = aiJuryProgressManager.subscribe(sessionId, (event) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

            // Close stream on session completion
            if (event.type === 'session_completed' || event.type === 'error') {
              setTimeout(() => {
                unsubscribe();
                controller.close();
              }, 1000);
            }
          } catch (error) {
            console.error('Error sending SSE event:', error);
          }
        });

        // Set up periodic status updates (less frequent now)
        const statusInterval = setInterval(async () => {
          try {
            const latestSession = await prisma.aIJurySession.findUnique({
              where: { id: sessionId },
            });

            if (latestSession) {
              const statusMessage = {
                id: Date.now().toString(),
                type: 'status',
                message: `Session Status: ${latestSession.status}`,
                data: {
                  currentLayer: latestSession.currentLayer,
                  totalProjects: latestSession.totalProjects,
                  eliminatedProjects: latestSession.eliminatedProjects,
                  remainingProjects: latestSession.totalProjects - latestSession.eliminatedProjects,
                  status: latestSession.status,
                },
                timestamp: new Date().toISOString(),
                sessionId: sessionId,
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(statusMessage)}\n\n`));

              // If session is completed, clean up and close
              if (latestSession.status === 'COMPLETED' || latestSession.status === 'FAILED') {
                clearInterval(statusInterval);
                unsubscribe();
                setTimeout(() => controller.close(), 1000);
              }
            }
          } catch (error) {
            console.error('Error in status update:', error);
          }
        }, 5000); // Check every 5 seconds for status updates

        // Clean up on abort
        request.signal.addEventListener('abort', () => {
          clearInterval(statusInterval);
          unsubscribe();
          controller.close();
        });
      },
    });

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('Error setting up SSE stream:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}