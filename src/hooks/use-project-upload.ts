/**
 * Custom hook for managing project upload operations
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  createProject,
  validateCSVData,
  bulkUploadProjects,
  downloadTemplate,
  validateFile,
} from '@/lib/project-api';
import type {
  ProjectCreate,
  ProjectCSVRow,
  ValidationResult
} from '@/lib/validations/project';

interface ProjectUploadState {
  isLoading: boolean;
  validationResult: ValidationResult | null;
  uploadResult: any | null;
  error: string | null;
}

interface UseProjectUploadOptions {
  hackathonId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

interface UseProjectUploadReturn {
  state: ProjectUploadState;
  createProject: (data: ProjectCreate) => Promise<void>;
  validateCSV: (projects: ProjectCSVRow[]) => Promise<ValidationResult>;
  uploadBulk: (projects: ProjectCSVRow[]) => Promise<void>;
  downloadTemplate: () => Promise<void>;
  reset: () => void;
}

export function useProjectUpload({
  hackathonId,
  onSuccess,
  onError,
}: UseProjectUploadOptions): UseProjectUploadReturn {
  const [state, setState] = useState<ProjectUploadState>({
    isLoading: false,
    validationResult: null,
    uploadResult: null,
    error: null,
  });

  const handleCreateProject = useCallback(async (data: ProjectCreate) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await createProject(hackathonId, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create project');
      }

      setState(prev => ({ ...prev, isLoading: false }));
      toast.success('Project created successfully!');
      onSuccess?.(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  }, [hackathonId, onSuccess, onError]);

  const handleValidateCSV = useCallback(async (projects: ProjectCSVRow[]): Promise<ValidationResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null, validationResult: null }));

    try {
      const validationResult = await validateCSVData(hackathonId, projects);

      setState(prev => ({
        ...prev,
        isLoading: false,
        validationResult
      }));

      if (validationResult.valid) {
        toast.success('CSV validation passed!');
      } else {
        toast.error(`Validation failed: ${validationResult.errorRows} errors found`);
      }

      return validationResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate CSV';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      toast.error(errorMessage);
      onError?.(errorMessage);
      throw error;
    }
  }, [hackathonId, onError]);

  const handleUploadBulk = useCallback(async (projects: ProjectCSVRow[]) => {
    setState(prev => ({ ...prev, isLoading: true, error: null, uploadResult: null }));

    try {
      const uploadResult = await bulkUploadProjects(hackathonId, projects);

      setState(prev => ({
        ...prev,
        isLoading: false,
        uploadResult,
      }));

      toast.success(`Successfully uploaded ${uploadResult.successful} projects!`);
      onSuccess?.(uploadResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload projects';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  }, [hackathonId, onSuccess, onError]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await downloadTemplate(hackathonId);
      toast.success('Template downloaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download template';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  }, [hackathonId, onError]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      validationResult: null,
      uploadResult: null,
      error: null,
    });
  }, []);

  return {
    state,
    createProject: handleCreateProject,
    validateCSV: handleValidateCSV,
    uploadBulk: handleUploadBulk,
    downloadTemplate: handleDownloadTemplate,
    reset,
  };
}

/**
 * Hook for managing file upload with drag and drop
 */
interface UseFileUploadOptions {
  accept?: Record<string, string[]>;
  maxSize?: number;
  onDrop?: (files: File[]) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  file: File | null;
  isDragActive: boolean;
  setFile: (file: File | null) => void;
  removeFile: () => void;
}

export function useFileUpload({
  accept = { 'text/csv': ['.csv'] },
  maxSize = 10 * 1024 * 1024, // 10MB
  onDrop,
  onError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      let errorMessage = 'File upload failed';

      if (error.code === 'file-too-large') {
        errorMessage = `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
      } else if (error.code === 'file-invalid-type') {
        errorMessage = 'Invalid file type. Please select a CSV file.';
      }

      onError?.(errorMessage);
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        onError?.(validation.error!);
        return;
      }

      setFile(selectedFile);
      onDrop?.([selectedFile]);
    }
  }, [maxSize, onDrop, onError]);

  const removeFile = useCallback(() => {
    setFile(null);
  }, []);

  return {
    file,
    isDragActive,
    setFile,
    removeFile,
  };
}

export default useProjectUpload;