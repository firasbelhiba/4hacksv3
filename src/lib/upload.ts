import { toast } from 'react-hot-toast';

import { fetchBackend } from '@/lib/api/fetch-backend';
// ================================
// IMAGE UPLOAD UTILITIES
// ================================

export interface UploadConfig {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  quality?: number; // 0-1 for compression
  maxWidth?: number;
  maxHeight?: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  size?: number;
  type?: string;
  error?: string;
}

const DEFAULT_CONFIG: UploadConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  quality: 0.9,
  maxWidth: 1920,
  maxHeight: 1080,
};

/**
 * Validate uploaded file
 */
export function validateFile(file: File, config: UploadConfig = {}): { valid: boolean; error?: string } {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Check file size
  if (file.size > finalConfig.maxSize!) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatFileSize(finalConfig.maxSize!)}`,
    };
  }

  // Check file type
  if (!finalConfig.allowedTypes!.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${finalConfig.allowedTypes!.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Upload file to the server
 */
export async function uploadFile(
  file: File,
  endpoint: string = '/api/hackathons/upload',
  config: UploadConfig = {}
): Promise<UploadResult> {
  const validation = validateFile(file, config);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    // Compress image if needed
    const processedFile = await processImage(file, config);

    const formData = new FormData();
    formData.append('file', processedFile);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Upload failed' };
    }

    return {
      success: true,
      url: result.data.url,
      filename: result.data.filename,
      size: result.data.size,
      type: result.data.type,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Network error during upload' };
  }
}

/**
 * Process and compress image
 */
export async function processImage(file: File, config: UploadConfig = {}): Promise<File> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      const maxWidth = finalConfig.maxWidth!;
      const maxHeight = finalConfig.maxHeight!;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx!.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new file with compressed data
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        finalConfig.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Delete uploaded file
 */
export async function deleteFile(
  filename: string,
  endpoint: string = '/api/hackathons/upload'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${endpoint}?filename=${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Delete failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Network error during delete' };
  }
}

/**
 * Generate thumbnail from image file
 */
export async function generateThumbnail(
  file: File,
  width: number = 200,
  height: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = width;
      canvas.height = height;

      // Calculate crop area to maintain aspect ratio
      const { width: imgWidth, height: imgHeight } = img;
      const ratio = Math.max(width / imgWidth, height / imgHeight);
      const newWidth = imgWidth * ratio;
      const newHeight = imgHeight * ratio;
      const offsetX = (width - newWidth) / 2;
      const offsetY = (height - newHeight) / 2;

      ctx!.drawImage(img, offsetX, offsetY, newWidth, newHeight);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    img.onerror = () => reject(new Error('Failed to generate thumbnail'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Read file as data URL for preview
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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
 * Get image dimensions
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to get image dimensions'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload with progress tracking
 */
export async function uploadWithProgress(
  file: File,
  endpoint: string = '/api/hackathons/upload',
  onProgress?: (progress: number) => void,
  config: UploadConfig = {}
): Promise<UploadResult> {
  const validation = validateFile(file, config);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const processedFile = await processImage(file, config);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', processedFile);

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const result = JSON.parse(xhr.responseText);

          if (xhr.status === 200 || xhr.status === 201) {
            resolve({
              success: true,
              url: result.data.url,
              filename: result.data.filename,
              size: result.data.size,
              type: result.data.type,
            });
          } else {
            resolve({ success: false, error: result.error || 'Upload failed' });
          }
        } catch (error) {
          resolve({ success: false, error: 'Invalid response from server' });
        }
      });

      xhr.addEventListener('error', () => {
        resolve({ success: false, error: 'Network error during upload' });
      });

      xhr.open('POST', endpoint);
      xhr.send(formData);
    });
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to process image' };
  }
}

/**
 * Batch upload multiple files
 */
export async function uploadMultipleFiles(
  files: File[],
  endpoint: string = '/api/hackathons/upload',
  onProgress?: (fileIndex: number, progress: number) => void,
  config: UploadConfig = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const result = await uploadWithProgress(
      file,
      endpoint,
      onProgress ? (progress) => onProgress(i, progress) : undefined,
      config
    );

    results.push(result);

    // Stop on first error if desired
    if (!result.success) {
      console.error(`Failed to upload file ${i + 1}:`, result.error);
    }
  }

  return results;
}

/**
 * Utility hook for managing upload state
 */
export interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedFiles: UploadResult[];
}

export function createUploadManager() {
  let state: UploadState = {
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFiles: [],
  };

  const listeners: ((state: UploadState) => void)[] = [];

  const setState = (newState: Partial<UploadState>) => {
    state = { ...state, ...newState };
    listeners.forEach(listener => listener(state));
  };

  const subscribe = (listener: (state: UploadState) => void) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  };

  const upload = async (
    file: File,
    endpoint?: string,
    config?: UploadConfig
  ) => {
    setState({ isUploading: true, progress: 0, error: null });

    try {
      const result = await uploadWithProgress(
        file,
        endpoint,
        (progress) => setState({ progress }),
        config
      );

      if (result.success) {
        setState({
          isUploading: false,
          progress: 100,
          uploadedFiles: [...state.uploadedFiles, result],
        });
        toast.success('File uploaded successfully');
      } else {
        setState({ isUploading: false, error: result.error || 'Upload failed' });
        toast.error(result.error || 'Upload failed');
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setState({ isUploading: false, error: errorMessage });
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const reset = () => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFiles: [],
    });
  };

  return {
    getState: () => state,
    subscribe,
    upload,
    reset,
  };
}