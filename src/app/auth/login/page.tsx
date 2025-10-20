'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, Terminal } from 'lucide-react';
import { LoginFormSchema } from '@/types/database';
import { z } from 'zod';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedFields = LoginFormSchema.safeParse(formData);

      if (!validatedFields.success) {
        const fieldErrors: Record<string, string> = {};
        validatedFields.error.issues.forEach((error) => {
          if (error.path.length > 0) {
            fieldErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }

      const result = await login(formData.email, formData.password);
      // Login function handles navigation on success
    } catch (error) {
      console.error('Login error:', error);
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
            Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-gray-800 bg-gray-900/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">
              Welcome back
            </CardTitle>
            <CardDescription className="text-center text-gray-400">
              Sign in to your admin account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                    placeholder="Enter your password"
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
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r from-purple-500 to-violet-500 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 ${
                  isLoading
                    ? 'opacity-75 cursor-not-allowed transform-none'
                    : 'hover:from-purple-600 hover:to-violet-600 transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-400">
              <p>
                Need to set up the first admin account?{' '}
                <Link
                  href="/auth/register"
                  className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
                >
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Secured by NextAuth.js • Built with Next.js 14
          </p>
        </div>
      </div>
    </div>
  );
}