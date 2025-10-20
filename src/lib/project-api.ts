/**
 * Project API helper functions
 * Simple API utilities following the existing lib pattern
 */

import type {
  ProjectCreate,
  ProjectCSVRow,
  ValidationResult,
} from '@/lib/validations/project';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

interface BulkUploadSummary {
  totalProcessed: number;
  successful: number;
  failed: number;
  projects?: any[];
}

/**
 * Create a single project
 */
export async function createProject(
  hackathonId: string,
  projectData: ProjectCreate
): Promise<ApiResponse> {
  const response = await fetchBackend(`/hackathons/${hackathonId}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(projectData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to create project');
  }

  return result;
}

/**
 * Validate CSV data before upload
 */
export async function validateCSVData(
  hackathonId: string,
  projects: ProjectCSVRow[]
): Promise<ValidationResult> {
  const response = await fetchBackend(`/hackathons/${hackathonId}/projects/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ projects }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Validation failed');
  }

  return result.data;
}

/**
 * Upload projects in bulk
 */
export async function bulkUploadProjects(
  hackathonId: string,
  projects: ProjectCSVRow[]
): Promise<BulkUploadSummary> {
  const response = await fetchBackend(`/hackathons/${hackathonId}/projects/bulk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ projects }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Bulk upload failed');
  }

  return result.data;
}

/**
 * Download CSV template
 */
export async function downloadTemplate(hackathonId: string): Promise<void> {
  const response = await fetchBackend(`/hackathons/${hackathonId}/projects/template`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to download template');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `projects_template.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Get template data as JSON (for component usage)
 */
export async function getTemplateData(hackathonId: string): Promise<ApiResponse> {
  const response = await fetchBackend(`/hackathons/${hackathonId}/projects/template`, {
    method: 'POST',
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Failed to get template data');
  }

  return result;
}

/**
 * Parse CSV text into project rows
 */
export function parseCSV(csvText: string): ProjectCSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1);

  return rows.map(row => {
    // Handle CSV parsing with quoted values
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Push the last value

    const rowObject: any = {};
    headers.forEach((header, index) => {
      rowObject[header] = values[index] || '';
    });

    return rowObject as ProjectCSVRow;
  });
}

/**
 * Validate file before processing
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
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