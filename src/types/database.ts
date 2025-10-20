import { z } from 'zod';

// Re-export all Prisma types
export type {
  User,
  Hackathon,
  Track,
  Project,
  Evaluation,
  EvaluationCriterion,
  Tournament,
  TournamentMatch,
  ActivityLog,
  ApiKey,
  UserRole,
  ProjectStatus,
  EvaluationStatus,
  TournamentFormat,
  TournamentStatus,
  MatchStatus,
  Prisma,
} from '@/generated/prisma';

// ================================
// HELPFUL TYPE ALIASES
// ================================

import type {
  User,
  Hackathon,
  Track,
  Project,
  Evaluation,
  EvaluationCriterion,
  Tournament,
  TournamentMatch,
  Prisma,
} from '@/generated/prisma';

// Hackathon with related data
export type HackathonWithTracks = Hackathon & {
  tracks: Track[];
};

export type HackathonWithProjects = Hackathon & {
  projects: (Project & {
    evaluation?: Evaluation | null;
  })[];
};

export type HackathonWithAll = Hackathon & {
  tracks: Track[];
  projects: (Project & {
    evaluation?: Evaluation | null;
    track: Track;
  })[];
  evaluationCriteria: EvaluationCriterion[];
  tournament?: Tournament | null;
  createdBy: User;
};

// Project with related data
export type ProjectWithEvaluation = Project & {
  evaluation?: Evaluation | null;
};

export type ProjectWithTrack = Project & {
  track: Track;
};

export type ProjectWithAll = Project & {
  track: Track;
  hackathon: Hackathon;
  evaluation?: Evaluation | null;
};

// Tournament with matches
export type TournamentWithMatches = Tournament & {
  matches: TournamentMatch[];
};

export type TournamentMatchWithProjects = TournamentMatch & {
  project1?: Project | null;
  project2?: Project | null;
  winner?: Project | null;
};

// User with relations
export type UserWithHackathons = User & {
  hackathons: Hackathon[];
};

// ================================
// ZOD VALIDATION SCHEMAS
// ================================

// User schemas
export const UserCreateSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  role: z.enum(['ADMIN', 'SUPER_ADMIN']).optional(),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({ password: true });

export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Hackathon schemas
export const HackathonCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  prizePool: z.string().optional(),
  organizationName: z.string().min(1, 'Organization name is required'),
  bannerImage: z.string().url('Invalid image URL').optional(),
  settings: z.record(z.string(), z.any()).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

export const HackathonUpdateSchema = HackathonCreateSchema.partial();

// Track schemas
export const TrackCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  prize: z.string().optional(),
  order: z.number().int().min(0).optional(),
  eligibilityCriteria: z.record(z.string(), z.any()).optional(),
  hackathonId: z.string().cuid(),
});

export const TrackUpdateSchema = TrackCreateSchema.partial().omit({ hackathonId: true });

// Team member schema
export const TeamMemberSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  role: z.string().optional(),
  id: z.string().optional(),
});

// Project schemas
export const ProjectCreateSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(200, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  teamName: z.string().min(1, 'Team name is required').max(100, 'Team name too long'),
  teamMembers: z.array(TeamMemberSchema).optional().default([]),
  githubUrl: z.string().url('Invalid GitHub URL'),
  demoUrl: z.string().url('Invalid demo URL').optional(),
  videoUrl: z.string().url('Invalid video URL').optional(),
  presentationUrl: z.string().url('Invalid presentation URL').optional(),
  hackathonId: z.string().cuid(),
  trackId: z.string().cuid(),
});

export const ProjectUpdateSchema = ProjectCreateSchema.partial().omit({ hackathonId: true });

// Evaluation schemas
export const EvaluationCreateSchema = z.object({
  projectId: z.string().cuid(),
  technicalScore: z.number().min(0).max(100).optional(),
  innovationScore: z.number().min(0).max(100).optional(),
  businessScore: z.number().min(0).max(100).optional(),
  documentationScore: z.number().min(0).max(100).optional(),
  presentationScore: z.number().min(0).max(100).optional(),
  plagiarismScore: z.number().min(0).max(100).optional(),
  feedback: z.record(z.string(), z.any()).optional(),
  strengths: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  evaluationDetails: z.record(z.string(), z.any()).optional(),
  aiModel: z.string().optional(),
  aiCost: z.number().min(0).optional(),
});

export const EvaluationUpdateSchema = EvaluationCreateSchema.partial().omit({ projectId: true });

// Evaluation criteria schemas
export const EvaluationCriterionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().optional(),
  weight: z.number().min(0).max(100, 'Weight must be between 0 and 100'),
  category: z.string().min(1, 'Category is required'),
  hackathonId: z.string().cuid(),
  order: z.number().int().min(0).optional(),
});

// Tournament schemas
export const TournamentCreateSchema = z.object({
  hackathonId: z.string().cuid(),
  format: z.enum(['SINGLE_ELIMINATION', 'DOUBLE_ELIMINATION', 'ROUND_ROBIN', 'SWISS']).optional(),
  brackets: z.record(z.string(), z.any()).optional(),
});

export const TournamentUpdateSchema = TournamentCreateSchema.partial().omit({ hackathonId: true });

// Tournament match schemas
export const TournamentMatchCreateSchema = z.object({
  tournamentId: z.string().cuid(),
  round: z.number().int().min(1),
  matchNumber: z.number().int().min(1),
  project1Id: z.string().cuid().optional(),
  project2Id: z.string().cuid().optional(),
  score1: z.number().min(0).optional(),
  score2: z.number().min(0).optional(),
  scheduledAt: z.coerce.date().optional(),
});

export const TournamentMatchUpdateSchema = TournamentMatchCreateSchema.partial().omit({ tournamentId: true });

// API Key schemas
export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  permissions: z.array(z.string()).optional(),
  expiresAt: z.coerce.date().optional(),
});

export const ApiKeyUpdateSchema = ApiKeyCreateSchema.partial();

// Activity log schema
export const ActivityLogCreateSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  metadata: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// ================================
// FORM VALIDATION SCHEMAS
// ================================

// Login form
export const LoginFormSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Registration form
export const RegisterFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Search and filter schemas
export const SearchSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'status', 'score']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// ================================
// TYPE INFERENCE FROM SCHEMAS
// ================================

export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;

export type HackathonCreate = z.infer<typeof HackathonCreateSchema>;
export type HackathonUpdate = z.infer<typeof HackathonUpdateSchema>;

export type TrackCreate = z.infer<typeof TrackCreateSchema>;
export type TrackUpdate = z.infer<typeof TrackUpdateSchema>;

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
export type ProjectUpdate = z.infer<typeof ProjectUpdateSchema>;

export type EvaluationCreate = z.infer<typeof EvaluationCreateSchema>;
export type EvaluationUpdate = z.infer<typeof EvaluationUpdateSchema>;

export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type LoginForm = z.infer<typeof LoginFormSchema>;
export type RegisterForm = z.infer<typeof RegisterFormSchema>;
export type SearchParams = z.infer<typeof SearchSchema>;
export type PaginationParams = z.infer<typeof PaginationSchema>;

// ================================
// UTILITY TYPES
// ================================

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Database operation result types
export interface CreateResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UpdateResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

// Evaluation result types
export interface EvaluationResult {
  overallScore: number;
  scores: {
    technical: number;
    innovation: number;
    business: number;
    documentation: number;
    presentation: number;
    plagiarism: number;
  };
  feedback: {
    summary: string;
    strengths: string[];
    improvements: string[];
    details: Record<string, any>;
  };
  metadata: {
    aiModel: string;
    evaluationTime: number;
    cost?: number;
  };
}