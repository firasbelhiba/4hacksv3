import { z } from 'zod';

// ================================
// PROJECT VALIDATION SCHEMAS
// ================================

// Team member schema
export const TeamMemberSchema = z.object({
  name: z.string()
    .min(1, 'Team member name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .email('Invalid email format')
    .optional(),
  role: z.string()
    .max(50, 'Role must be less than 50 characters')
    .optional(),
});

// Core project schema
export const ProjectSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string()
    .min(1, 'Project name is required')
    .max(100, 'Project name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_&.()]+$/, 'Project name contains invalid characters'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  teamName: z.string()
    .min(1, 'Team name is required')
    .max(100, 'Team name must be less than 100 characters'),
  teamMembers: z.array(TeamMemberSchema)
    .max(10, 'Maximum 10 team members allowed')
    .optional()
    .default([]),
  githubUrl: z.string()
    .url('Invalid GitHub URL format')
    .refine((url) => {
      const githubPattern = /^https:\/\/(github\.com|www\.github\.com)\/.+/;
      return githubPattern.test(url);
    }, 'Must be a valid GitHub repository URL'),
  demoUrl: z.string()
    .url('Invalid demo URL format')
    .optional()
    .or(z.literal('')),
  videoUrl: z.string()
    .url('Invalid video URL format')
    .optional()
    .or(z.literal('')),
  presentationUrl: z.string()
    .url('Invalid presentation URL format')
    .optional()
    .or(z.literal('')),
  trackId: z.string().cuid('Invalid track selected'),
  hackathonId: z.string().cuid('Invalid hackathon selected'),
});

// Project creation schema (without ID)
export const ProjectCreateSchema = ProjectSchema.omit({ id: true });

// Project update schema (all fields optional except ID)
export const ProjectUpdateSchema = ProjectSchema.partial().extend({
  id: z.string().cuid(),
});

// CSV row schema for bulk upload
export const ProjectCSVRowSchema = z.object({
  project_name: z.string().min(1, 'Project name is required'),
  team_name: z.string().min(1, 'Team name is required'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  github_url: z.string().url('Invalid GitHub URL'),
  demo_url: z.string().url('Invalid demo URL').optional().or(z.literal('')),
  video_url: z.string().url('Invalid video URL').optional().or(z.literal('')),
  track_name: z.string().min(1, 'Track name is required'),
  team_members: z.string().optional(),
});

// Bulk upload schema
export const ProjectBulkCreateSchema = z.object({
  projects: z.array(ProjectCSVRowSchema)
    .min(1, 'At least one project is required')
    .max(500, 'Maximum 500 projects allowed in bulk upload'),
  hackathonId: z.string().cuid(),
});

// Validation result schemas
export const ValidationErrorSchema = z.object({
  row: z.number(),
  field: z.string(),
  message: z.string(),
  value: z.any().optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  totalRows: z.number(),
  validRows: z.number(),
  errorRows: z.number(),
  warningRows: z.number(),
  errors: z.array(ValidationErrorSchema),
  warnings: z.array(ValidationErrorSchema),
  duplicates: z.array(z.object({
    row: z.number(),
    field: z.string(),
    value: z.string(),
    duplicateRows: z.array(z.number()),
  })),
});

// CSV template schema
export const CSVTemplateSchema = z.object({
  project_name: z.string(),
  team_name: z.string(),
  description: z.string(),
  github_url: z.string(),
  demo_url: z.string().optional(),
  video_url: z.string().optional(),
  track_name: z.string(),
  team_members: z.string(),
});

// ================================
// TYPE INFERENCE
// ================================

export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;
export type ProjectCSVRow = z.infer<typeof ProjectCSVRowSchema>;
export type ProjectBulkCreate = z.infer<typeof ProjectBulkCreateSchema>;
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type CSVTemplate = z.infer<typeof CSVTemplateSchema>;

// ================================
// VALIDATION HELPERS
// ================================

export const validateGitHubUrl = (url: string): boolean => {
  const githubPattern = /^https:\/\/(github\.com|www\.github\.com)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
  return githubPattern.test(url);
};

export const parseTeamMembers = (teamMembersString: string): TeamMember[] => {
  return teamMembersString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(name => ({ name }));
};


export const generateProjectSlug = (projectName: string, teamName: string): string => {
  const combined = `${projectName} ${teamName}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
};

// ================================
// DEFAULT VALUES
// ================================

export const DEFAULT_PROJECT: Partial<ProjectCreate> = {
  name: '',
  description: '',
  teamName: '',
  teamMembers: [],
  githubUrl: '',
  demoUrl: '',
  videoUrl: '',
  presentationUrl: '',
};

export const CSV_TEMPLATE_HEADERS = [
  'project_name',
  'team_name',
  'description',
  'github_url',
  'demo_url',
  'video_url',
  'track_name',
  'team_members'
] as const;

export const CSV_TEMPLATE_EXAMPLE: CSVTemplate = {
  project_name: 'AI Health Monitor',
  team_name: 'Team Alpha',
  description: 'An AI-powered health monitoring application that tracks vital signs and provides personalized health recommendations using machine learning algorithms.',
  github_url: 'https://github.com/team-alpha/ai-health-monitor',
  demo_url: 'https://ai-health-demo.vercel.app',
  video_url: 'https://youtube.com/watch?v=example',
  track_name: 'Healthcare',
  team_members: 'John Doe,Jane Smith,Bob Wilson'
};