import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Creates a new user account. The first user registered will automatically be assigned the SUPER_ADMIN role. Subsequent users will be assigned the ADMIN role.',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      example: {
        user: {
          id: 'clx1234567890',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: '2025-10-04T12:00:00.000Z',
        },
        message: 'User created successfully',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or email already exists',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be a valid email', 'password must be at least 6 characters'],
        error: 'Bad Request',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login user',
    description: 'Authenticates a user and returns a JWT access token for subsequent API requests.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'clx1234567890',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Get('register/status')
  @ApiOperation({
    summary: 'Check registration availability',
    description: 'Returns whether new user registration is currently allowed. Returns true if no users exist, false otherwise.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration status retrieved',
    schema: {
      example: {
        allowed: false,
        message: 'Registration is currently disabled',
      },
    },
  })
  async checkRegistrationStatus() {
    return this.authService.checkRegistrationAllowed();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns the authenticated user\'s profile information based on the JWT token.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        user: {
          id: 'clx1234567890',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: '2025-10-04T12:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async getProfile(@CurrentUser() user: any) {
    return {
      user,
    };
  }
}
