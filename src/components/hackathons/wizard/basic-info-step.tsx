'use client';

import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { slugify } from '@/lib/utils';
import { uploadFile, deleteFile, formatFileSize } from '@/lib/upload';
import type { BasicInfo } from '@/lib/validations/hackathon';
import { cn } from '@/lib/utils';

interface BasicInfoStepProps {
  data: BasicInfo;
  onUpdate: (data: BasicInfo) => void;
  errors?: Record<string, any>;
}

export function BasicInfoStep({ data, onUpdate, errors }: BasicInfoStepProps) {
  const { setValue, watch, formState: { errors: formErrors } } = useFormContext<BasicInfo>();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Watch all form values for real-time updates
  const name = watch('name', data.name);
  const slug = watch('slug', data.slug);
  const organizationName = watch('organizationName', data.organizationName);
  const prizePool = watch('prizePool', data.prizePool);
  const description = watch('description', data.description);
  const bannerImage = watch('bannerImage', data.bannerImage);

  // Handle input changes
  const handleInputChange = (field: keyof BasicInfo, value: string) => {
    setValue(field, value as any, { shouldValidate: true });
    onUpdate({ ...data, [field]: value });
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setValue('name', name, { shouldValidate: true });
    const newData = { ...data, name };
    if (!data.slug || data.slug === slugify(data.name)) {
      const newSlug = slugify(name);
      setValue('slug', newSlug, { shouldValidate: true });
      newData.slug = newSlug;
    }
    onUpdate(newData);
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setUploading(true);

    try {
      const result = await uploadFile(file, '/api/hackathons/upload', {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      });

      if (result.success && result.url) {
        setValue('bannerImage', result.url);
        onUpdate({ ...data, bannerImage: result.url });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [data, onUpdate, setValue]);

  // Handle file removal
  const handleRemoveImage = useCallback(async () => {
    if (bannerImage) {
      try {
        // Extract filename from URL
        const filename = bannerImage.split('/').pop();
        if (filename) {
          await deleteFile(filename);
        }
      } catch (error) {
        console.error('Failed to delete file:', error);
      }

      setValue('bannerImage', '', { shouldValidate: true });
      onUpdate({ ...data, bannerImage: '' });
    }
  }, [bannerImage, data, onUpdate, setValue]);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    handleFileUpload(acceptedFiles);
    setDragActive(false);
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Basic Information
        </h2>
        <p className="text-muted-foreground">
          Let's start with the essential details about your hackathon.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form Fields */}
        <div className="space-y-6">
          {/* Hackathon Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Hackathon Name *
            </Label>
            <Input
              id="name"
              value={name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., AI Innovation Challenge 2024"
              className={cn(
                'transition-all duration-200',
                formErrors?.name && 'border-red-500 focus:ring-red-500'
              )}
            />
            {formErrors?.name && (
              <p className="text-sm text-red-500">{formErrors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug" className="text-sm font-medium">
              URL Slug *
            </Label>
            <Input
              id="slug"
              value={slug || ''}
              onChange={(e) => handleInputChange('slug', e.target.value)}
              placeholder="ai-innovation-challenge-2024"
              className={cn(
                'font-mono text-sm transition-all duration-200',
                formErrors?.slug && 'border-red-500 focus:ring-red-500'
              )}
            />
            <p className="text-xs text-muted-foreground">
              This will be part of your hackathon's URL: /hackathons/{slug || 'your-slug'}
            </p>
            {formErrors?.slug && (
              <p className="text-sm text-red-500">{formErrors.slug.message}</p>
            )}
          </div>

          {/* Organization Name */}
          <div className="space-y-2">
            <Label htmlFor="organizationName" className="text-sm font-medium">
              Organization Name *
            </Label>
            <Input
              id="organizationName"
              value={organizationName || ''}
              onChange={(e) => handleInputChange('organizationName', e.target.value)}
              placeholder="e.g., Tech Corp, University of Technology"
              className={cn(
                'transition-all duration-200',
                formErrors?.organizationName && 'border-red-500 focus:ring-red-500'
              )}
            />
            {formErrors?.organizationName && (
              <p className="text-sm text-red-500">{formErrors.organizationName.message}</p>
            )}
          </div>

          {/* Prize Pool */}
          <div className="space-y-2">
            <Label htmlFor="prizePool" className="text-sm font-medium">
              Prize Pool (Optional)
            </Label>
            <Input
              id="prizePool"
              value={prizePool || ''}
              onChange={(e) => handleInputChange('prizePool', e.target.value)}
              placeholder="e.g., $10,000, €5,000"
              className={cn(
                'transition-all duration-200',
                formErrors?.prizePool && 'border-red-500 focus:ring-red-500'
              )}
            />
            {formErrors?.prizePool && (
              <p className="text-sm text-red-500">{formErrors.prizePool.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description *
            </Label>
            <Textarea
              id="description"
              value={description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your hackathon's theme, goals, and what participants can expect..."
              rows={5}
              className={cn(
                'resize-none transition-all duration-200',
                formErrors?.description && 'border-red-500 focus:ring-red-500'
              )}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Minimum 50 characters, maximum 2000 characters
              </p>
              <p className="text-xs text-muted-foreground">
                {description?.length || 0}/2000
              </p>
            </div>
            {formErrors?.description && (
              <p className="text-sm text-red-500">{formErrors.description.message}</p>
            )}
          </div>
        </div>

        {/* Right Column - Banner Image Upload */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Banner Image (Optional)
            </Label>
            <p className="text-xs text-muted-foreground">
              Upload a banner image for your hackathon. Recommended size: 1200x630px
            </p>
          </div>

          {/* Image Upload Area */}
          <Card className="border-dashed border-2 border-border/50 hover:border-purple-500/50 transition-colors duration-200">
            <CardContent className="p-6">
              {bannerImage ? (
                /* Image Preview */
                <div className="relative group">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative rounded-lg overflow-hidden"
                  >
                    <img
                      src={bannerImage}
                      alt="Banner preview"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImage}
                        className="flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </Button>
                    </div>
                  </motion.div>
                </div>
              ) : (
                /* Upload Dropzone */
                <div
                  {...getRootProps()}
                  className={cn(
                    'relative border-dashed border-2 border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
                    (isDragActive || dragActive) && 'border-purple-500 bg-purple-50 dark:bg-purple-950/50',
                    uploading && 'pointer-events-none opacity-50'
                  )}
                >
                  <input {...getInputProps()} />

                  {uploading ? (
                    <div className="flex flex-col items-center space-y-3">
                      <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                      <p className="text-sm text-muted-foreground">Uploading...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      {isDragActive ? (
                        <>
                          <Upload className="w-8 h-8 text-purple-500" />
                          <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                            Drop your image here
                          </p>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              Click to upload or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              PNG, JPG, WEBP up to 5MB
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {formErrors?.bannerImage && (
            <p className="text-sm text-red-500">{formErrors.bannerImage.message}</p>
          )}

          {/* Upload Guidelines */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Image Guidelines</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Recommended dimensions: 1200x630px (16:9 aspect ratio)</li>
              <li>• Maximum file size: 5MB</li>
              <li>• Supported formats: PNG, JPG, WEBP</li>
              <li>• Will be used for social media sharing and event promotion</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <h4 className="text-sm font-semibold text-purple-800 dark:text-purple-200 mb-2">
            💡 Tips for a Great Hackathon
          </h4>
          <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
            <li>• Choose a memorable and descriptive name that reflects your theme</li>
            <li>• Write a compelling description that attracts the right participants</li>
            <li>• Include your organization's full name for credibility</li>
            <li>• A clear prize structure motivates participation</li>
            <li>• High-quality banner images improve social media engagement</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}