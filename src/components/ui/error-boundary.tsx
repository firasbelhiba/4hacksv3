'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GradientBg } from '@/components/shared/gradient-bg';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error
    console.error('Error Boundary caught an error:', error, errorInfo);

    // Call onError callback if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send error to logging service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <GradientBg variant="primary" className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-card/90 backdrop-blur-xl border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-xl text-red-600 dark:text-red-400">
            Something went wrong
          </CardTitle>
          <CardDescription>
            An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Details for Development */}
          {isDevelopment && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Error Details (Development)
              </h4>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {error.message}
              </p>
              {error.stack && (
                <details className="mt-2">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                    Stack Trace
                  </summary>
                  <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Error ID for Production */}
          {!isDevelopment && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Error ID: <code className="text-xs bg-muted px-2 py-1 rounded">ERR_{Date.now()}</code>
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2">
          <Button onClick={retry} className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <a href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </a>
          </Button>
        </CardFooter>
      </Card>
    </GradientBg>
  );
}

// HOC wrapper for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Custom error types
export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class PermissionError extends Error {
  constructor(message: string = 'Permission denied') {
    super(message);
    this.name = 'PermissionError';
  }
}

// Error fallback components for specific errors
export function NetworkErrorFallback({ error, retry }: { error: NetworkError; retry: () => void }) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Connection Problem</h3>
      <p className="text-muted-foreground mb-4">
        Unable to connect to the server. Please check your internet connection.
      </p>
      <Button onClick={retry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

export function AuthErrorFallback({ retry }: { error: AuthenticationError; retry: () => void }) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
      <p className="text-muted-foreground mb-4">
        Your session has expired. Please log in again.
      </p>
      <div className="space-x-2">
        <Button asChild>
          <a href="/auth/login">Log In</a>
        </Button>
        <Button variant="outline" onClick={retry}>
          Retry
        </Button>
      </div>
    </div>
  );
}