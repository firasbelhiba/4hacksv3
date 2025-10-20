import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  ProjectCSVRowSchema,
  validateGitHubUrl,
  parseTeamMembers
} from '@/lib/validations/project';
import type { ValidationResult } from '@/lib/validations/project';

// POST /api/hackathons/[id]/projects/validate - Validate CSV data before upload
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
    const { projects: csvRows } = body;

    if (!Array.isArray(csvRows)) {
      return NextResponse.json(
        { success: false, error: 'Projects data must be an array' },
        { status: 400 }
      );
    }

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
        projects: {
          select: { name: true },
        },
      },
    });

    if (!hackathon) {
      return NextResponse.json(
        { success: false, error: 'Hackathon not found or access denied' },
        { status: 404 }
      );
    }

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

    // Track project names for duplicate detection
    const projectNames = new Set<string>();
    const existingProjectNames = new Set(
      hackathon.projects.map(p => p.name.toLowerCase())
    );

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      const rowNumber = i + 1;
      let hasRowErrors = false;

      try {
        // Validate basic row structure
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
          hasRowErrors = true;
        } else {
          const data = validatedRow.data;

          // Validate GitHub URL format
          if (!validateGitHubUrl(data.github_url)) {
            validationResult.errors.push({
              row: rowNumber,
              field: 'github_url',
              message: 'Must be a valid GitHub repository URL (https://github.com/...)',
              value: data.github_url,
            });
            hasRowErrors = true;
          }

          // Validate track exists
          const track = hackathon.tracks.find(
            t => t.name.toLowerCase() === data.track_name.toLowerCase()
          );

          if (!track) {
            const availableTracks = hackathon.tracks.map(t => t.name).join(', ');
            validationResult.errors.push({
              row: rowNumber,
              field: 'track_name',
              message: `Track "${data.track_name}" not found. Available tracks: ${availableTracks}`,
              value: data.track_name,
            });
            hasRowErrors = true;
          }

          // Check for duplicate project names within CSV
          const projectNameLower = data.project_name.toLowerCase();
          if (projectNames.has(projectNameLower)) {
            const duplicateRows = [];
            for (let j = 0; j < i; j++) {
              if (csvRows[j].project_name?.toLowerCase() === projectNameLower) {
                duplicateRows.push(j + 1);
              }
            }

            validationResult.duplicates.push({
              row: rowNumber,
              field: 'project_name',
              value: data.project_name,
              duplicateRows,
            });
            hasRowErrors = true;
          } else {
            projectNames.add(projectNameLower);
          }

          // Check if project already exists in database
          if (existingProjectNames.has(projectNameLower)) {
            validationResult.errors.push({
              row: rowNumber,
              field: 'project_name',
              message: 'Project with this name already exists in the hackathon',
              value: data.project_name,
            });
            hasRowErrors = true;
          }

          // Validate team members
          const teamMembers = parseTeamMembers(data.team_members || '');
          if (teamMembers.length > 10) {
            validationResult.warnings.push({
              row: rowNumber,
              field: 'team_members',
              message: 'More than 10 team members may affect performance',
              value: data.team_members,
            });
          }


          // Validate URLs format (if provided)
          if (data.demo_url && data.demo_url.trim()) {
            try {
              new URL(data.demo_url);
            } catch {
              validationResult.errors.push({
                row: rowNumber,
                field: 'demo_url',
                message: 'Invalid demo URL format',
                value: data.demo_url,
              });
              hasRowErrors = true;
            }
          }

          if (data.video_url && data.video_url.trim()) {
            try {
              new URL(data.video_url);
            } catch {
              validationResult.errors.push({
                row: rowNumber,
                field: 'video_url',
                message: 'Invalid video URL format',
                value: data.video_url,
              });
              hasRowErrors = true;
            }
          }

          // Check description length
          if (data.description.length > 2000) {
            validationResult.errors.push({
              row: rowNumber,
              field: 'description',
              message: 'Description must be less than 2000 characters',
              value: `${data.description.length} characters`,
            });
            hasRowErrors = true;
          }
        }
      } catch (error) {
        validationResult.errors.push({
          row: rowNumber,
          field: 'general',
          message: `Failed to validate row: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        hasRowErrors = true;
      }

      if (!hasRowErrors) {
        validationResult.validRows++;
      }
    }

    validationResult.errorRows = validationResult.totalRows - validationResult.validRows;
    validationResult.warningRows = new Set(validationResult.warnings.map(w => w.row)).size;
    validationResult.valid = validationResult.errorRows === 0 && validationResult.duplicates.length === 0;

    return NextResponse.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    console.error('Error validating CSV data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}