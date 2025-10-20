import { z } from 'zod';

// ================================
// SIMPLIFIED TRACK VALIDATION SCHEMAS
// ================================

// Core track schema for our simplified batch editor
export const TrackSchema = z.object({
  id: z.string().cuid().optional(), // For editing existing tracks
  name: z.string()
    .min(1, 'Track name is required')
    .max(50, 'Track name must be less than 50 characters')
    .regex(/^[a-zA-Z0-9\s\-_&]+$/, 'Track name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands'),
  description: z.string()
    .min(10, 'Track description must be at least 10 characters')
    .max(1000, 'Track description must be less than 1000 characters'),
  prize: z.string()
    .optional()
    .refine((val) => !val || /^\$?[\d,]+(\.\d{2})?$/.test(val), 'Invalid prize format (e.g., $1,000 or $1,000.00)'),
  order: z.number().int().min(0).default(0),
  eligibilityCriteria: z.array(z.string()).optional(),
});

// ================================
// TYPE INFERENCE
// ================================

export type Track = z.infer<typeof TrackSchema>;