import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ProjectBulkCreateSchema,
  ProjectCSVRowSchema,
  generateProjectSlug,
  parseTeamMembers,
  validateGitHubUrl
} from '@/lib/validations/project';
import type { ApiResponse } from '@/types/database';
import type { ValidationResult } from '@/lib/validations/project';

// POST /api/hackathons/[id]/projects/bulk - Bulk create projects from CSV
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
    const body = await request.json();

    // Validate the bulk data
    const validatedData = ProjectBulkCreateSchema.safeParse({
      ...body,
      hackathonId,
    });

    if (!validatedData.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid bulk upload data',
          details: validatedData.error.issues
        },
        { status: 400 }
      );
    }

    const { projects: csvRows } = validatedData.data;

    // Verify hackathon exists and user has access
    const hackathon = await prisma.hackathon.findFirst({
      where: {
        id: hackathonId,
        createdById: session.user.id,
      },
      include: {
        tracks: {
          select: { id: true, name: true },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

    // Validate and transform CSV data
    const validationResult: ValidationResult = {
      valid: true,
      totalRows: csvRows.length,
      validRows: 0,
      errorRows: 0,
      warningRows: 0,
      errors: [],
      warnings: [],
      duplicates: [],
    };

    const processedProjects: any[] = [];
    const projectNames = new Set<string>();

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const rowNumber = i + 1;

      try {
        // Validate row structure
        const validatedRow = ProjectCSVRowSchema.safeParse(row);
        if (!validatedRow.success) {
          validatedRow.error.issues.forEach(issue => {
            validationResult.errors.push({
              row: rowNumber,
              field: issue.path.join('.'),
              message: issue.message,
              value: issue.path.length > 0 ? row[issue.path[0] as keyof typeof row] : undefined,
            });
          });
          continue;
        }

        const data = validatedRow.data;

        // Validate GitHub URL format
        if (!validateGitHubUrl(data.github_url)) {
          validationResult.errors.push({
            row: rowNumber,
            field: 'github_url',
            message: 'Must be a valid GitHub repository URL',
            value: data.github_url,
          });
        }

        // Find track by name
        const track = hackathon.tracks.find(
          t => t.name.toLowerCase() === data.track_name.toLowerCase()
        );

        if (!track) {
          validationResult.errors.push({
            row: rowNumber,
            field: 'track_name',
            message: `Track "${data.track_name}" not found in this hackathon`,
            value: data.track_name,
          });
        }

        // Check for duplicate project names within CSV
        const projectNameLower = data.project_name.toLowerCase();
        if (projectNames.has(projectNameLower)) {
          validationResult.duplicates.push({
            row: rowNumber,
            field: 'project_name',
            value: data.project_name,
            duplicateRows: Array.from({ length: i }, (_, idx) =>
              csvRows[idx].project_name.toLowerCase() === projectNameLower ? idx + 1 : null
            ).filter(Boolean) as number[],
          });
        } else {
          projectNames.add(projectNameLower);
        }

        // Parse team members
        const teamMembers = parseTeamMembers(data.team_members || '');



        // If no errors for this row, add to processed projects
        const hasRowErrors = validationResult.errors.some(e => e.row === rowNumber);
        if (!hasRowErrors && track) {
          const slug = generateProjectSlug(data.project_name, data.team_name);

          processedProjects.push({
            name: data.project_name,
            slug: slug,
            description: data.description,
            teamName: data.team_name,
            teamMembers: teamMembers,
            githubUrl: data.github_url,
            demoUrl: data.demo_url || null,
            videoUrl: data.video_url || null,
            presentationUrl: null,
            trackId: track.id,
            hackathonId,
            status: 'SUBMITTED',
            submittedAt: new Date(),
          });
          validationResult.validRows++;
        }
      } catch (error) {
        validationResult.errors.push({
          row: rowNumber,
          field: 'general',
          message: `Failed to process row: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    validationResult.errorRows = validationResult.totalRows - validationResult.validRows;
    validationResult.valid = validationResult.errorRows === 0 && validationResult.duplicates.length === 0;

    // If there are validation errors, return them without creating projects
    if (!validationResult.valid) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        validationResult,
      }, { status: 400 });
    }

    // Check for existing project names in database
    const existingProjects = await prisma.project.findMany({
      where: {
        hackathonId,
        name: {
          in: processedProjects.map(p => p.name),
        },
      },
      select: { name: true },
    });

    if (existingProjects.length > 0) {
      const existingNames = existingProjects.map(p => p.name);
      existingNames.forEach(name => {
        const rowIndex = processedProjects.findIndex(p => p.name === name);
        if (rowIndex !== -1) {
          validationResult.errors.push({
            row: rowIndex + 1,
            field: 'project_name',
            message: 'Project with this name already exists in the hackathon',
            value: name,
          });
        }
      });

      return NextResponse.json({
        success: false,
        error: 'Duplicate project names found',
        validationResult,
      }, { status: 409 });
    }

    // Generate unique slugs for all projects
    for (let i = 0; i < processedProjects.length; i++) {
      const project = processedProjects[i];
      let slug = project.slug;
      let counter = 1;

      // Check against existing slugs in database and other processed projects
      while (
        await prisma.project.findFirst({ where: { hackathonId, slug } }) ||
        processedProjects.slice(0, i).some(p => p.slug === slug)
      ) {
        slug = `${project.slug}-${counter}`;
        counter++;
      }

      project.slug = slug;
    }

    // Create all projects in a transaction
    const createdProjects = await prisma.$transaction(
      processedProjects.map(project =>
        prisma.project.create({
          data: project,
          include: {
            track: {
              select: { id: true, name: true },
            },
            hackathon: {
              select: { id: true, name: true },
            },
          },
        })
      )
    );

    const response: ApiResponse = {
      success: true,
      data: {
        projects: createdProjects,
        summary: {
          totalProcessed: processedProjects.length,
          successful: createdProjects.length,
          failed: 0,
        },
      },
      message: `Successfully created ${createdProjects.length} projects`,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error in bulk project creation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}