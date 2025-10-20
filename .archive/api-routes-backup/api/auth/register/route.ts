import { NextRequest, NextResponse } from 'next/server';
import { createUser, isFirstUser } from '@/lib/auth';
import { RegisterFormSchema } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedFields = RegisterFormSchema.safeParse(body);

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validatedFields.error.issues
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedFields.data;

    // Check if this is the first user
    const isFirst = await isFirstUser();

    // Create user with appropriate role
    const user = await createUser({
      name,
      email,
      password,
      role: isFirst ? 'SUPER_ADMIN' : 'ADMIN'
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    // Handle unique constraint violations (email already exists)
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Email already exists'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if registration is allowed (no users exist)
    const isFirst = await isFirstUser();

    return NextResponse.json({
      success: true,
      data: {
        registrationAllowed: isFirst,
        message: isFirst
          ? 'Registration is allowed for the first admin user'
          : 'Registration is not allowed - admin user already exists'
      }
    });

  } catch (error) {
    console.error('Registration check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}