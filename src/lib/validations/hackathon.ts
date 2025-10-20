import { z } from 'zod';

// ================================
// MULTI-STEP WIZARD VALIDATION SCHEMAS
// ================================

// Step 1: Basic Information
export const BasicInfoSchema = z.object({
  name: z.string()
    .min(1, 'Hackathon name is required')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(50, 'Slug must be less than 50 characters')
    .regex(/^[a-z0-9\-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  organizationName: z.string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name must be less than 100 characters'),
  prizePool: z.string()
    .optional()
    .refine((val) => !val || /^\$?[\d,]+(\.\d{2})?$/.test(val), 'Invalid prize pool format'),
  bannerImage: z.string()
    .url('Invalid image URL')
    .optional()
    .or(z.literal('')),
});

// Step 2: Schedule & Timeline
export const ScheduleSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  registrationDeadline: z.coerce.date().optional(),
  evaluationPeriodEnd: z.coerce.date().optional(),
  resultAnnouncementDate: z.coerce.date().optional(),
  timezone: z.string().default('UTC'),
}).superRefine((data, ctx) => {
  const now = new Date();

  // For past events or dates, allow any start date (no minimum time requirement)
  // Only enforce the 24-hour rule for future events being created
  const isHistoricalEvent = data.startDate < now;

  if (!isHistoricalEvent) {
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Start date must be at least 24 hours from now for new future events
    if (data.startDate < oneDayFromNow) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Start date must be at least 24 hours from now",
        path: ["startDate"]
      });
    }
  }

  // End date must be after start date
  if (data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after start date",
      path: ["endDate"]
    });
  }

  // Registration deadline can be before start date (pre-registration) or after start date (late registration)
  // We'll allow flexibility here - no strict validation on registration deadline timing

  // Evaluation period must be after end date
  if (data.evaluationPeriodEnd && data.evaluationPeriodEnd <= data.endDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Evaluation period must end after hackathon end date",
      path: ["evaluationPeriodEnd"]
    });
  }

  // Results announcement must be after evaluation period or end date
  if (data.resultAnnouncementDate) {
    const evaluationEnd = data.evaluationPeriodEnd || data.endDate;
    if (data.resultAnnouncementDate <= evaluationEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Results announcement must be after evaluation period ends",
        path: ["resultAnnouncementDate"]
      });
    }
  }
});

// Track schema for dynamic tracks
export const TrackSchema = z.object({
  id: z.string().optional(), // For editing existing tracks
  name: z.string()
    .min(1, 'Track name is required')
    .max(50, 'Track name must be less than 50 characters'),
  description: z.string()
    .min(10, 'Track description must be at least 10 characters')
    .max(500, 'Track description must be less than 500 characters'),
  prize: z.union([
    z.string(),
    z.null(),
    z.undefined()
  ]).optional()
    .refine((val) => !val || val === '' || /^\$?[\d,]+(\.\d{2})?$/.test(val), 'Invalid prize format'),
  eligibilityCriteria: z.union([
    z.array(z.string()),
    z.null(),
    z.undefined()
  ]).optional()
    .default([]),
  maxParticipants: z.number()
    .int()
    .min(1, 'Must allow at least 1 participant')
    .max(1000, 'Maximum 1000 participants allowed')
    .optional(),
  order: z.number().int().min(0).default(0),
});

// Step 3: Tracks Configuration
export const TracksSchema = z.object({
  tracks: z.array(TrackSchema)
    .min(1, 'At least one track is required')
    .max(10, 'Maximum 10 tracks allowed')
    .refine((tracks) => {
      const names = tracks.map(t => t.name.toLowerCase());
      const uniqueNames = new Set(names);
      return names.length === uniqueNames.size;
    }, {
      message: "Track names must be unique",
      path: ["tracks"]
    }),
});

// Step 3: Settings & Review
export const SettingsSchema = z.object({
  isPublic: z.boolean().default(true),
  requireGithubRepo: z.boolean().default(true),
  requireDemoVideo: z.boolean().default(false),
  autoStartEvaluation: z.boolean().default(true),
  notifyParticipants: z.boolean().default(true),
  additionalSettings: z.record(z.string(), z.any()).optional(),
});

// Complete hackathon creation schema (tracks managed separately)
export const HackathonWizardSchema = z.object({
  basicInfo: BasicInfoSchema,
  schedule: ScheduleSchema,
  settings: SettingsSchema,
});

// ================================
// UPDATE SCHEMAS
// ================================

// For editing existing hackathons (tracks managed separately)
export const HackathonUpdateSchema = z.object({
  basicInfo: BasicInfoSchema.partial().optional(),
  schedule: ScheduleSchema.partial().optional(),
  settings: SettingsSchema.partial().optional(),
}).refine((data) => {
  // At least one section must be provided
  return Object.values(data).some(section => section !== undefined);
}, {
  message: "At least one section must be provided for update",
});

// Bulk operations
export const BulkDeleteSchema = z.object({
  hackathonIds: z.array(z.string().cuid())
    .min(1, 'At least one hackathon must be selected')
    .max(20, 'Cannot delete more than 20 hackathons at once'),
  confirmationText: z.string()
    .min(1, 'Confirmation text is required'),
});

// ================================
// FILTER AND SEARCH SCHEMAS
// ================================

export const HackathonFilterSchema = z.object({
  query: z.string().optional(),
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
  endDateFrom: z.coerce.date().optional(),
  endDateTo: z.coerce.date().optional(),
  organizationName: z.string().optional(),
  createdBy: z.string().cuid().optional(),
  sortBy: z.enum(['name', 'createdAt', 'startDate', 'endDate', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
});

// ================================
// TYPE INFERENCE
// ================================

export type BasicInfo = z.infer<typeof BasicInfoSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Track = z.infer<typeof TrackSchema>;
export type Tracks = z.infer<typeof TracksSchema>;
export type Settings = z.infer<typeof SettingsSchema>;
export type HackathonWizard = z.infer<typeof HackathonWizardSchema>;
export type HackathonUpdate = z.infer<typeof HackathonUpdateSchema>;
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;
export type HackathonFilter = z.infer<typeof HackathonFilterSchema>;

// ================================
// WIZARD STEP TYPES
// ================================

export type WizardStep = 'basicInfo' | 'schedule' | 'settings';

export interface WizardStepInfo {
  id: WizardStep;
  title: string;
  description: string;
  isOptional?: boolean;
}

export const WIZARD_STEPS: WizardStepInfo[] = [
  {
    id: 'basicInfo',
    title: 'Basic Information',
    description: 'Name, description, and organization details',
  },
  {
    id: 'schedule',
    title: 'Schedule & Timeline',
    description: 'Event dates and important deadlines',
  },
  {
    id: 'settings',
    title: 'Settings & Review',
    description: 'Final settings and review all details',
  },
];

// ================================
// DEFAULT VALUES
// ================================

export const DEFAULT_BASIC_INFO: Partial<BasicInfo> = {
  name: '',
  slug: '',
  description: '',
  organizationName: '',
  prizePool: '',
  bannerImage: '',
};

export const DEFAULT_SCHEDULE: Partial<Schedule> = {
  timezone: 'UTC',
  // Set default dates to tomorrow and next week to pass validation
  startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
};

export const DEFAULT_TRACKS: Tracks = {
  tracks: [
    {
      name: 'General Track',
      description: 'Open to all participants with any project type',
      order: 0,
    },
  ],
};

export const DEFAULT_EVALUATION_CRITERIA: EvaluationCriteria = {
  criteria: [
    {
      name: 'Technical Excellence',
      description: 'Code quality, architecture, and technical implementation',
      weight: 30,
      category: 'Technical',
      order: 0,
    },
    {
      name: 'Innovation',
      description: 'Creativity, originality, and novel approach',
      weight: 25,
      category: 'Innovation',
      order: 1,
    },
    {
      name: 'Business Viability',
      description: 'Market potential and business model',
      weight: 20,
      category: 'Business',
      order: 2,
    },
    {
      name: 'Documentation',
      description: 'Project documentation and presentation quality',
      weight: 15,
      category: 'Documentation',
      order: 3,
    },
    {
      name: 'Presentation',
      description: 'Demo quality and presentation skills',
      weight: 10,
      category: 'Presentation',
      order: 4,
    },
  ],
};

export const DEFAULT_SETTINGS: Settings = {
  isPublic: true,
  requireGithubRepo: true,
  requireDemoVideo: false,
  autoStartEvaluation: true,
  notifyParticipants: true,
};