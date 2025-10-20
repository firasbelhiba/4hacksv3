import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { CSV_TEMPLATE_HEADERS, CSV_TEMPLATE_EXAMPLE } from '@/lib/validations/project';

// GET /api/hackathons/[id]/projects/template - Download CSV template
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

    const hackathonId = params.id;

    // Verify hackathon exists and user has access
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
      include: {
        tracks: {
          select: { name: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    // Get track names for the example
    const trackNames = hackathon.tracks.map(t => t.name);
    const exampleTrackName = trackNames.length > 0 ? trackNames[0] : 'General Track';

    // Create CSV content
    const headers = CSV_TEMPLATE_HEADERS.join(',');

    // Create example rows with actual track names from the hackathon
    const exampleRow1 = [
      '"AI Health Monitor"',
      '"Team Alpha"',
      '"An AI-powered health monitoring application that tracks vital signs and provides personalized health recommendations using machine learning algorithms."',
      '"https://github.com/team-alpha/ai-health-monitor"',
      '"https://ai-health-demo.vercel.app"',
      '"https://youtube.com/watch?v=dQw4w9WgXcQ"',
      `"${exampleTrackName}"`,
      '"React,Node.js,TensorFlow,MongoDB"',
      '"John Doe,Jane Smith,Bob Wilson"'
    ].join(',');

    const exampleRow2 = [
      '"Smart City Dashboard"',
      '"Code Warriors"',
      '"A comprehensive dashboard for monitoring and managing smart city infrastructure with real-time data visualization and predictive analytics."',
      '"https://github.com/code-warriors/smart-city-dashboard"',
      '"https://smart-city-demo.netlify.app"',
      '""',
      `"${trackNames.length > 1 ? trackNames[1] : exampleTrackName}"`,
      '"Vue.js,Python,PostgreSQL,Docker"',
      '"Alice Johnson,Charlie Brown"'
    ].join(',');

    const csvContent = [
      headers,
      exampleRow1,
      exampleRow2
    ].join('\n');

    // Create response with proper headers for file download
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${hackathon.name.replace(/[^a-zA-Z0-9]/g, '_')}_projects_template.csv"`,
        'Cache-Control': 'no-cache',
      },
    });

    return response;
  } catch (error) {
    console.error('Error generating CSV template:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/hackathons/[id]/projects/template - Get template data as JSON
export async function POST(
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

    const hackathonId = params.id;

    // Verify hackathon exists and user has access
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
      include: {
        tracks: {
          select: { id: true, name: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        headers: CSV_TEMPLATE_HEADERS,
        example: CSV_TEMPLATE_EXAMPLE,
        tracks: hackathon.tracks,
        hackathon: {
          id: hackathon.id,
          name: hackathon.name,
        },
      },
    });
  } catch (error) {
    console.error('Error getting template data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}