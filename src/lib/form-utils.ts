import { format, isValid, parseISO, addDays, isBefore, isAfter } from 'date-fns';

// ================================
// SLUG GENERATION
// ================================

/**
 * Generate a URL-safe slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Generate a unique slug by checking against existing slugs
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[] = []
): string {
  const baseSlug = slugify(text);

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}

// ================================
// DATE VALIDATION AND FORMATTING
// ================================

/**
 * Validate if a date string is valid
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * Format date for form inputs (YYYY-MM-DDTHH:MM)
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Format date for display
 */
export function formatDateForDisplay(
  date: Date | string,
  formatString: string = 'PPP p'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return format(dateObj, formatString);
}

/**
 * Validate hackathon date timeline
 */
export interface DateValidation {
  isValid: boolean;
  errors: string[];
}

export function validateHackathonDates(dates: {
  startDate?: Date | string;
  endDate?: Date | string;
  registrationDeadline?: Date | string;
  evaluationPeriodEnd?: Date | string;
  resultAnnouncementDate?: Date | string;
}): DateValidation {
  const errors: string[] = [];
  const now = new Date();
  const oneDayFromNow = addDays(now, 1);

  // Convert strings to dates
  const startDate = dates.startDate ?
    (typeof dates.startDate === 'string' ? parseISO(dates.startDate) : dates.startDate) : null;
  const endDate = dates.endDate ?
    (typeof dates.endDate === 'string' ? parseISO(dates.endDate) : dates.endDate) : null;
  const registrationDeadline = dates.registrationDeadline ?
    (typeof dates.registrationDeadline === 'string' ? parseISO(dates.registrationDeadline) : dates.registrationDeadline) : null;
  const evaluationPeriodEnd = dates.evaluationPeriodEnd ?
    (typeof dates.evaluationPeriodEnd === 'string' ? parseISO(dates.evaluationPeriodEnd) : dates.evaluationPeriodEnd) : null;
  const resultAnnouncementDate = dates.resultAnnouncementDate ?
    (typeof dates.resultAnnouncementDate === 'string' ? parseISO(dates.resultAnnouncementDate) : dates.resultAnnouncementDate) : null;

  // Validate required dates
  if (!startDate || !isValid(startDate)) {
    errors.push('Start date is required and must be valid');
  }
  if (!endDate || !isValid(endDate)) {
    errors.push('End date is required and must be valid');
  }

  if (startDate && endDate && isValid(startDate) && isValid(endDate)) {
    // For past events, allow any start date (no minimum time requirement)
    // Only enforce the 24-hour rule for future events being created
    const isHistoricalEvent = isBefore(startDate, now);

    if (!isHistoricalEvent) {
      // Start date must be at least 24 hours from now for new future events
      if (isBefore(startDate, oneDayFromNow)) {
        errors.push('Start date must be at least 24 hours from now');
      }
    }

    // End date must be after start date
    if (!isAfter(endDate, startDate)) {
      errors.push('End date must be after start date');
    }

    // Registration deadline must be before start date
    if (registrationDeadline && isValid(registrationDeadline)) {
      if (!isBefore(registrationDeadline, startDate)) {
        errors.push('Registration deadline must be before start date');
      }
    }

    // Evaluation period must be after end date
    if (evaluationPeriodEnd && isValid(evaluationPeriodEnd)) {
      if (!isAfter(evaluationPeriodEnd, endDate)) {
        errors.push('Evaluation period end must be after hackathon end date');
      }
    }

    // Results announcement must be after evaluation period or end date
    if (resultAnnouncementDate && isValid(resultAnnouncementDate)) {
      const evaluationEnd = evaluationPeriodEnd || endDate;
      if (!isAfter(resultAnnouncementDate, evaluationEnd)) {
        errors.push('Results announcement must be after evaluation period');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ================================
// WEIGHT DISTRIBUTION CALCULATOR
// ================================

/**
 * Calculate total weight from criteria array
 */
export function calculateTotalWeight(
  criteria: Array<{ weight: number }>
): number {
  return criteria.reduce((total, criterion) => total + criterion.weight, 0);
}

/**
 * Validate that weights sum to 100%
 */
export function validateWeightDistribution(
  criteria: Array<{ weight: number }>,
  tolerance: number = 0.01
): { isValid: boolean; total: number; difference: number } {
  const total = calculateTotalWeight(criteria);
  const difference = Math.abs(total - 100);

  return {
    isValid: difference <= tolerance,
    total,
    difference,
  };
}

/**
 * Normalize weights to sum to 100%
 */
export function normalizeWeights<T extends { weight: number }>(
  criteria: T[]
): T[] {
  const total = calculateTotalWeight(criteria);

  if (total === 0) {
    // If all weights are 0, distribute evenly
    const evenWeight = 100 / criteria.length;
    return criteria.map(criterion => ({
      ...criterion,
      weight: evenWeight,
    }));
  }

  // Scale weights to sum to 100
  const scaleFactor = 100 / total;
  return criteria.map(criterion => ({
    ...criterion,
    weight: Math.round(criterion.weight * scaleFactor * 100) / 100,
  }));
}

/**
 * Suggest weight adjustments to reach 100%
 */
export function suggestWeightAdjustments(
  criteria: Array<{ name: string; weight: number }>,
  targetTotal: number = 100
): Array<{ name: string; currentWeight: number; suggestedWeight: number }> {
  const currentTotal = calculateTotalWeight(criteria);
  const difference = targetTotal - currentTotal;

  if (Math.abs(difference) < 0.01) {
    return []; // Already balanced
  }

  const adjustmentPerCriterion = difference / criteria.length;

  return criteria.map(criterion => ({
    name: criterion.name,
    currentWeight: criterion.weight,
    suggestedWeight: Math.max(0, Math.round((criterion.weight + adjustmentPerCriterion) * 100) / 100),
  }));
}

// ================================
// FORM DATA PERSISTENCE
// ================================

/**
 * Save wizard form data to localStorage
 */
export function saveWizardProgress(
  wizardId: string,
  step: string,
  data: any
): void {
  try {
    const storageKey = `wizard_${wizardId}`;

    // Convert dates to ISO strings for serialization
    const serializedData = JSON.parse(JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }));

    // Add metadata
    serializedData.lastSaved = new Date().toISOString();
    serializedData.currentStep = step;

    localStorage.setItem(storageKey, JSON.stringify(serializedData));
    console.log(`💾 Saved wizard progress to localStorage:`, {
      wizardId,
      currentStep: step,
      lastSaved: serializedData.lastSaved,
      dataKeys: Object.keys(serializedData).filter(k => !['lastSaved', 'currentStep', 'completedSteps'].includes(k))
    });
  } catch (error) {
    console.error('Failed to save wizard progress:', error);
  }
}

/**
 * Load wizard form data from localStorage
 */
export function loadWizardProgress(wizardId: string): any {
  try {
    const storageKey = `wizard_${wizardId}`;
    const data = localStorage.getItem(storageKey);

    if (!data) return null;

    // Parse and restore dates from ISO strings
    const parsedData = JSON.parse(data, (key, value) => {
      // Check if value looks like an ISO date string
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        const date = new Date(value);
        // Only return Date if it's valid
        return isNaN(date.getTime()) ? value : date;
      }
      return value;
    });

    console.log(`📁 Loaded wizard progress from localStorage:`, {
      lastSaved: parsedData.lastSaved,
      steps: Object.keys(parsedData).filter(k => !['lastSaved', 'currentStep', 'completedSteps'].includes(k))
    });

    return parsedData;
  } catch (error) {
    console.error('Failed to load wizard progress:', error);
    return null;
  }
}

/**
 * Clear wizard form data from localStorage
 */
export function clearWizardProgress(wizardId: string): void {
  try {
    const storageKey = `wizard_${wizardId}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear wizard progress:', error);
  }
}

// ================================
// VALIDATION HELPERS
// ================================

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate email format (simple)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate file extension
 */
export function isValidFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const extension = filename.split('.').pop()?.toLowerCase();
  return extension ? allowedExtensions.includes(extension) : false;
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
 * Debounce function for form inputs
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
 * Generate random color for track/criterion visualization
 */
export function generateRandomColor(opacity: number = 1): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsla(${hue}, 70%, 60%, ${opacity})`;
}

/**
 * Get contrasting text color for background
 */
export function getContrastColor(backgroundColor: string): string {
  // Simple implementation - in practice, you might want a more sophisticated algorithm
  const rgb = backgroundColor.match(/\d+/g);
  if (!rgb) return '#000000';

  const brightness = (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
  return brightness > 128 ? '#000000' : '#ffffff';
}