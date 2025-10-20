import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import type { ApiResponse } from '@/types/database';

// POST /api/hackathons/upload - Upload hackathon banner image
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 5MB' },
        { status: 400 }
      );
    }

    // Create unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'hackathons');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Save file
    const filePath = join(uploadDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/hackathons/${uniqueFilename}`;

    const response: ApiResponse = {
      success: true,
      data: {
        filename: uniqueFilename,
        url: publicUrl,
        size: file.size,
        type: file.type,
      },
      message: 'File uploaded successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

// DELETE /api/hackathons/upload - Delete uploaded image
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }

    // Validate filename format (security check)
    if (!/^[a-f0-9\-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      return NextResponse.json(
        { success: false, error: 'Invalid filename' },
        { status: 400 }
      );
    }

    const filePath = join(process.cwd(), 'public', 'uploads', 'hackathons', filename);

    try {
      const fs = require('fs').promises;
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, that's okay
      console.log('File does not exist or already deleted:', filename);
    }

    const response: ApiResponse = {
      success: true,
      message: 'File deleted successfully',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}