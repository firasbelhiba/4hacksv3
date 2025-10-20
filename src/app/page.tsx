'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Settings, Bot, Trophy, ArrowRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FEATURES } from '@/lib/constants';

const FeatureCard = ({ title, description, icon: Icon }: { title: string; description: string; icon: LucideIcon }) => (
  <Card className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-all duration-300 animate-slide-up hover:scale-105">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <CardTitle className="text-xl font-bold">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-center text-muted-foreground">
        {description}
      </CardDescription>
    </CardContent>
  </Card>
);

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth or redirecting
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const iconMap = {
    Settings,
    Bot,
    Trophy,
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Animated Background */}
      <div className="fixed inset-0 gradient-animated opacity-10 -z-10" />

      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 opacity-50" />

        <div className="relative z-10 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            <span className="gradient-text">4hacks</span>
            <br />
            <span className="text-foreground">AI-Powered Hackathon Platform</span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
            The ultimate hackathon management platform with AI evaluation agents and tournament bracket system
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
            <Button
              size="lg"
              className="gradient-primary hover:opacity-90 transition-opacity group"
              onClick={() => router.push('/auth/login')}
            >
              Get Started
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
              onClick={() => router.push('/auth/login')}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Floating elements */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float opacity-60" />
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-secondary rounded-full animate-float opacity-40" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-primary rounded-full animate-float opacity-80" style={{ animationDelay: '4s' }} />
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 gradient-text">
              Powerful Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run successful hackathons with cutting-edge AI technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => {
              const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
              return (
                <div
                  key={feature.title}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <FeatureCard
                    title={feature.title}
                    description={feature.description}
                    icon={IconComponent}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to revolutionize your hackathons?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of organizers who trust 4hacks for their events
          </p>
          <Button
            size="lg"
            className="gradient-primary hover:opacity-90 transition-opacity"
            onClick={() => router.push('/auth/login')}
          >
            Start Your Journey
          </Button>
        </div>
      </section>
    </main>
  );
}
