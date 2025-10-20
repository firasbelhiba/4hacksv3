'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Download, Upload, FileText, AlertCircle, CheckCircle, X, Loader2, FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UploadProgress, useUploadProgress } from './upload-progress';
import { ErrorDisplay } from './error-display';
import { parseCSV } from '@/lib/project-api';
import { toast } from 'react-hot-toast';
import type { ValidationResult, ValidationError } from '@/lib/validations/project';

import { fetchBackend } from '@/lib/api/fetch-backend';
interface Track {
  id: string;
  name: string;
  description?: string;
  prize?: string;
}

interface CSVBulkUploadProps {
  hackathonId: string;
  tracks: Track[];
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

interface UploadState {
  file: File | null;
  isValidating: boolean;
  isUploading: boolean;
  validationResult: ValidationResult | null;
  uploadResult: any | null;
}

export function CSVBulkUpload({
  hackathonId,
  tracks,
  onSuccess,
  onCancel
}: CSVBulkUploadProps) {
  const [state, setState] = useState<UploadState>({
    file: null,
    isValidating: false,
    isUploading: false,
    validationResult: null,
    uploadResult: null,
  });

  const { steps, currentStep, startStep, completeStep, failStep, resetSteps } = useUploadProgress([
    { id: 'parse', label: 'Parse CSV File' },
    { id: 'validate', label: 'Validate Data' },
    { id: 'upload', label: 'Upload Projects' },
    { id: 'complete', label: 'Finalize Upload' },
  ]);


  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setState(prev => ({
      ...prev,
      file,
      validationResult: null,
      uploadResult: null,
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const downloadTemplate = async () => {
    try {
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
      a.download = `projects_template_${hackathonId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
  };

  const validateCSV = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isValidating: true }));
    resetSteps();

    try {
      // Step 1: Parse CSV
      startStep('parse', 'Reading and parsing CSV file...');
      const fileText = await state.file.text();
      const projects = parseCSV(fileText);

      if (projects.length === 0) {
        throw new Error('CSV file appears to be empty or invalid');
      }

      completeStep('parse', `Parsed ${projects.length} rows from CSV`, {
        totalRows: projects.length,
        fileSize: state.file.size,
      });

      // Step 2: Validate Data
      startStep('validate', 'Validating project data...');

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

      setState(prev => ({
        ...prev,
        validationResult: result.data,
      }));

      if (result.data.valid) {
        completeStep('validate', 'All data is valid and ready for upload', {
          validRows: result.data.validRows,
          errorRows: result.data.errorRows,
          warningRows: result.data.warningRows,
        });
        toast.success('CSV validation passed! Ready to upload.');
      } else {
        failStep('validate', `Found ${result.data.errorRows} validation errors`, result.data);
        toast.error(`Validation failed: ${result.data.errorRows} errors found`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate CSV';
      failStep(currentStep || 'parse', errorMessage, error);
      console.error('Error validating CSV:', error);
      toast.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isValidating: false }));
    }
  };

  const uploadProjects = async () => {
    if (!state.file || !state.validationResult?.valid) return;

    setState(prev => ({ ...prev, isUploading: true }));

    try {
      // Step 3: Upload Projects
      startStep('upload', `Uploading ${state.validationResult.validRows} projects...`);

      const fileText = await state.file.text();
      const projects = parseCSV(fileText);

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
        throw new Error(result.error || 'Upload failed');
      }

      completeStep('upload', `Successfully uploaded ${result.data.summary.successful} projects`, {
        successful: result.data.summary.successful,
        failed: result.data.summary.failed,
        totalProcessed: result.data.summary.totalProcessed,
      });

      // Step 4: Complete
      startStep('complete', 'Finalizing upload...');

      setState(prev => ({
        ...prev,
        uploadResult: result.data,
      }));

      completeStep('complete', 'Upload completed successfully', result.data.summary);

      toast.success(`Successfully uploaded ${result.data.summary.successful} projects!`);
      onSuccess?.(result.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload projects';
      failStep(currentStep || 'upload', errorMessage, error);
      console.error('Error uploading projects:', error);
      toast.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isUploading: false }));
    }
  };

  const resetUpload = () => {
    setState({
      file: null,
      isValidating: false,
      isUploading: false,
      validationResult: null,
      uploadResult: null,
    });
    resetSteps();
  };


  if (state.uploadResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Upload Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Projects Uploaded Successfully</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {state.uploadResult.summary.successful}
                </div>
                <div className="text-sm text-muted-foreground">Projects Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {state.uploadResult.summary.totalProcessed}
                </div>
                <div className="text-sm text-muted-foreground">Total Processed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {state.uploadResult.summary.failed}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={resetUpload} variant="outline">
              Upload More Projects
            </Button>
            {onCancel && (
              <Button onClick={onCancel}>
                Done
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            CSV Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Download the CSV template with the correct format and example data.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Available tracks: {tracks.map(t => t.name).join(', ')}
              </p>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload CSV File
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!state.file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-blue-600">Drop the CSV file here...</p>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to select a file
                  </p>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Select CSV File
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium">{state.file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(state.file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={validateCSV}
                  disabled={state.isValidating}
                  size="sm"
                >
                  {state.isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate'
                  )}
                </Button>
                <Button
                  onClick={resetUpload}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Tracking */}
      {(state.isValidating || state.isUploading || steps.some(step => step.status !== 'pending')) && (
        <UploadProgress
          steps={steps}
          currentStep={currentStep}
          onCancel={state.isUploading ? undefined : resetUpload}
          onRetry={state.validationResult && !state.validationResult.valid ? validateCSV : undefined}
        />
      )}

      {/* Validation Results */}
      {state.validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {state.validationResult.valid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              Validation Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {state.validationResult.totalRows}
                </div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {state.validationResult.validRows}
                </div>
                <div className="text-sm text-muted-foreground">Valid Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {state.validationResult.errorRows}
                </div>
                <div className="text-sm text-muted-foreground">Error Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">
                  {state.validationResult.warningRows}
                </div>
                <div className="text-sm text-muted-foreground">Warning Rows</div>
              </div>
            </div>

            {state.validationResult.valid ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All data is valid and ready for upload!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please fix the errors below before uploading.
                </AlertDescription>
              </Alert>
            )}

            {/* Upload Button */}
            {state.validationResult.valid && (
              <div className="flex gap-4 pt-4 border-t">
                {onCancel && (
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    disabled={state.isUploading}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  onClick={uploadProjects}
                  disabled={state.isUploading}
                  className="flex-1"
                >
                  {state.isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading {state.validationResult.validRows} Projects...
                    </>
                  ) : (
                    `Upload ${state.validationResult.validRows} Projects`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {state.validationResult && state.validationResult.errors.length > 0 && (
        <ErrorDisplay
          errors={state.validationResult.errors}
          onRetry={validateCSV}
        />
      )}

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Required Columns</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">project_name</p>
                <p className="text-muted-foreground">Unique project name</p>
              </div>
              <div>
                <p className="font-medium">team_name</p>
                <p className="text-muted-foreground">Team identifier</p>
              </div>
              <div>
                <p className="font-medium">description</p>
                <p className="text-muted-foreground">Min 50 characters</p>
              </div>
              <div>
                <p className="font-medium">github_url</p>
                <p className="text-muted-foreground">Valid GitHub repo URL</p>
              </div>
              <div>
                <p className="font-medium">track_name</p>
                <p className="text-muted-foreground">Must match existing track</p>
              </div>
              <div>
                <p className="font-medium">technologies</p>
                <p className="text-muted-foreground">Comma-separated list</p>
              </div>
              <div>
                <p className="font-medium">team_members</p>
                <p className="text-muted-foreground">Comma-separated names</p>
              </div>
              <div>
                <p className="font-medium">demo_url</p>
                <p className="text-muted-foreground">Optional demo link</p>
              </div>
              <div>
                <p className="font-medium">video_url</p>
                <p className="text-muted-foreground">Optional video link</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Important Notes</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use quotes around values containing commas</li>
              <li>Maximum 500 projects per upload</li>
              <li>Validation checks for duplicates and format errors</li>
              <li>Track names must match exactly (case-insensitive)</li>
              <li>GitHub URLs must be valid repository links</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}