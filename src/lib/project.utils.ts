/**
 * Project utility functions
 * Common transformations and helpers for project data
 */

import type {
  ProjectCSVRow,
  TeamMember,
  ValidationError
} from '@/lib/validations/project';

/**
 * Transform CSV row to project data format
 */
export function transformCSVRowToProject(row: ProjectCSVRow, trackId: string): any {
  return {
    name: row.project_name,
    teamName: row.team_name,
    description: row.description,
    githubUrl: row.github_url,
    demoUrl: row.demo_url || null,
    videoUrl: row.video_url || null,
    trackId,
    teamMembers: parseTeamMembers(row.team_members || ''),
  };
}

/**
 * Parse team members string into TeamMember array
 */
export function parseTeamMembers(teamMembersString: string): TeamMember[] {
  if (!teamMembersString.trim()) return [];

  return teamMembersString
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0)
    .map(name => ({ name }));
}


/**
 * Format team members array into display string
 */
export function formatTeamMembers(teamMembers: TeamMember[]): string {
  return teamMembers.map(member => member.name).join(', ');
}

/**
 * Format technologies array into display string
 */
export function formatTechnologies(technologies: string[]): string {
  return technologies.join(', ');
}

/**
 * Generate project slug from name and team name
 */
export function generateProjectSlug(projectName: string, teamName: string): string {
  const combined = `${projectName} ${teamName}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

/**
 * Validate GitHub URL format
 */
export function validateGitHubUrl(url: string): boolean {
  const githubPattern = /^https:\/\/(github\.com|www\.github\.com)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+\/?$/;
  return githubPattern.test(url);
}

/**
 * Extract repository info from GitHub URL
 */
export function extractGitHubInfo(url: string): { owner: string; repo: string } | null {
  const match = url.match(/https:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_.-]+)\/?$/);
  if (!match) return null;

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/, '')
  };
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate CSV content from project data
 */
export function generateCSVContent(projects: any[], headers: string[]): string {
  const csvRows = [
    headers.join(','), // Header row
    ...projects.map(project => {
      return headers.map(header => {
        let value = '';

        switch (header) {
          case 'project_name':
            value = project.name || '';
            break;
          case 'team_name':
            value = project.teamName || '';
            break;
          case 'description':
            value = project.description || '';
            break;
          case 'github_url':
            value = project.githubUrl || '';
            break;
          case 'demo_url':
            value = project.demoUrl || '';
            break;
          case 'video_url':
            value = project.videoUrl || '';
            break;
          case 'track_name':
            value = project.track?.name || '';
            break;
          case 'technologies':
            value = Array.isArray(project.technologies)
              ? project.technologies.join(',')
              : project.technologies || '';
            break;
          case 'team_members':
            value = Array.isArray(project.teamMembers)
              ? project.teamMembers.map((m: any) => m.name).join(',')
              : project.teamMembers || '';
            break;
          default:
            value = '';
        }

        // Escape quotes and wrap in quotes if contains comma
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }

        return value;
      }).join(',');
    })
  ];

  return csvRows.join('\n');
}

/**
 * Group validation errors by row
 */
export function groupValidationErrorsByRow(errors: ValidationError[]): Record<number, ValidationError[]> {
  return errors.reduce((acc, error) => {
    if (!acc[error.row]) acc[error.row] = [];
    acc[error.row].push(error);
    return acc;
  }, {} as Record<number, ValidationError[]>);
}

/**
 * Get validation error summary
 */
export function getValidationErrorSummary(errors: ValidationError[]): {
  fieldErrors: Record<string, number>;
  totalErrors: number;
  affectedRows: number;
} {
  const fieldErrors: Record<string, number> = {};
  const affectedRows = new Set<number>();

  errors.forEach(error => {
    fieldErrors[error.field] = (fieldErrors[error.field] || 0) + 1;
    affectedRows.add(error.row);
  });

  return {
    fieldErrors,
    totalErrors: errors.length,
    affectedRows: affectedRows.size,
  };
}

/**
 * Calculate upload progress percentage
 */
export function calculateUploadProgress(
  completed: number,
  total: number,
  stage: 'validation' | 'upload' | 'complete' = 'upload'
): number {
  if (total === 0) return 0;

  const baseProgress = (completed / total) * 100;

  switch (stage) {
    case 'validation':
      return Math.min(baseProgress * 0.3, 30); // Validation is 30% of total
    case 'upload':
      return Math.min(30 + (baseProgress * 0.6), 90); // Upload is 60% of total
    case 'complete':
      return 100;
    default:
      return baseProgress;
  }
}

/**
 * Debounce function for search and validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for progress updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Safe JSON parse with error handling
 */
export function safeJsonParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}

/**
 * Create download link for data
 */
export function downloadData(data: string, filename: string, mimeType: string = 'text/plain'): void {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Check if string is valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: string = 'MMM d, yyyy'): string {
  const d = new Date(date);

  if (isNaN(d.getTime())) return 'Invalid Date';

  const options: Intl.DateTimeFormatOptions = {};

  if (format.includes('MMM')) {
    options.month = 'short';
  }
  if (format.includes('d')) {
    options.day = 'numeric';
  }
  if (format.includes('yyyy')) {
    options.year = 'numeric';
  }
  if (format.includes('h:mm')) {
    options.hour = 'numeric';
    options.minute = '2-digit';
  }

  return d.toLocaleDateString('en-US', options);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}