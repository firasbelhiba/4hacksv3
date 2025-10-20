'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Terminal, CheckCircle, XCircle, Shield } from 'lucide-react';
import { RegisterFormSchema } from '@/types/database';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationAllowed, setRegistrationAllowed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const router = useRouter();

  // Check if registration is allowed
  useEffect(() => {
    const checkRegistrationStatus = async () => {
      try {
        const response = await fetchBackend('/auth/register');
        const result = await response.json();

        if (result.success) {
          setRegistrationAllowed(result.data.registrationAllowed);
        }
      } catch (error) {
        console.error('Error checking registration status:', error);
        toast.error('Failed to check registration status');
      } finally {
        setIsCheckingRegistration(false);
      }
    };

    checkRegistrationStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedFields = RegisterFormSchema.safeParse(formData);

      if (!validatedFields.success) {
        const fieldErrors: Record<string, string> = {};
        validatedFields.error.issues.forEach((error: any) => {
          if (error.path.length > 0) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      const response = await fetchBackend('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Account created successfully! Please sign in.');
        router.push('/auth/login');
      } else {
        if (result.details) {
          const fieldErrors: Record<string, string> = {};
          result.details.forEach((error: any) => {
            if (error.path.length > 0) {
              fieldErrors[error.path[0] as string] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          toast.error(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (isCheckingRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Checking registration status...</p>
        </div>
      </div>
    );
  }

  if (!registrationAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
        <div className="relative z-10 w-full max-w-md">
          <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-red-400" />
              </div>
              <CardTitle className="text-xl font-bold text-white">
                Registration Not Available
              </CardTitle>
              <CardDescription className="text-gray-400">
                An admin account already exists in the system.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-400 mb-6">
                Only the first admin registration is allowed for security purposes.
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />

      {/* Floating Orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl">
              <Terminal className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            4hacks
          </h1>
          <p className="text-gray-400 mt-2">
            First Admin Setup
          </p>
        </div>

        {/* Registration Alert */}
        <Alert className="mb-6 border-green-500/50 bg-green-500/10">
          <Shield className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            You're setting up the first admin account. This will be a Super Admin with full system access.
          </AlertDescription>
        </Alert>

        {/* Registration Card */}
        <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Create Admin Account
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Set up your super admin account to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-200">
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
                {errors.name && (
                  <p className="text-sm text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="admin@4hacks.com"
                  disabled={isLoading}
                  className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
                {errors.email && (
                  <p className="text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400">{errors.password}</p>
                )}
                <p className="text-xs text-gray-400">
                  Must contain uppercase, lowercase, and number
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                    className="bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Admin Account'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <p>
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            This account will have Super Admin privileges • Secured by bcryptjs
          </p>
        </div>
      </div>
    </div>
  );
}