'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X, Github, Globe, Video, FileText, Users, Calendar, Trophy, ExternalLink, Copy, Check, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDateForDisplay } from '@/lib/form-utils';

interface TeamMember {
  name: string;
  email?: string;
  role?: string;
}

interface Track {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string;
  teamName: string;
  teamMembers: TeamMember[];
  githubUrl: string;
  demoUrl?: string | null;
  videoUrl?: string | null;
  presentationUrl?: string | null;
  status: string;
  submittedAt?: string | null;
  createdAt: string;
  track: Track;
  hackathon: {
    id: string;
    name: string;
  };
}

interface ProjectDetailModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onAnalyzeCode?: (project: Project) => void;
  isAnalyzing?: boolean;
}

export function ProjectDetailModal({ project, isOpen, onClose, onAnalyzeCode, isAnalyzing }: ProjectDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNDER_REVIEW':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <p className="text-muted-foreground">by {project.teamName}</p>
            </div>
            <Badge variant="outline" className={getStatusColor(project.status)}>
              {project.status.replace('_', ' ')}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-600" />
                  Competition Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Hackathon</p>
                  <p className="font-medium">{project.hackathon.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Track</p>
                  <p className="font-medium">{project.track.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Project Slug</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">{project.slug}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(project.slug, 'slug')}
                    >
                      {copiedField === 'slug' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDateForDisplay(project.createdAt, 'MMM d, yyyy h:mm a')}</p>
                </div>
                {project.submittedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted</p>
                    <p className="font-medium">{formatDateForDisplay(project.submittedAt, 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Project Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>

          {/* Team Members */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Team Members ({project.teamMembers?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.teamMembers && project.teamMembers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {project.teamMembers.map((member, index) => (
                    <div key={index} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{member.name}</p>
                      {member.email && (
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      )}
                      {member.role && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Solo project - no team members listed</p>
              )}
            </CardContent>
          </Card>

          {/* Project Links */}
          <Card>
            <CardHeader>
              <CardTitle>Project Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GitHub URL */}
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span className="font-medium">GitHub Repository</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(project.githubUrl, 'github')}
                    >
                      {copiedField === 'github' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </Button>
                    <Link href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Demo URL */}
                {project.demoUrl && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span className="font-medium">Live Demo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(project.demoUrl!, 'demo')}
                      >
                        {copiedField === 'demo' ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Link href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Video URL */}
                {project.videoUrl && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      <span className="font-medium">Demo Video</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(project.videoUrl!, 'video')}
                      >
                        {copiedField === 'video' ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Link href={project.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Presentation URL */}
                {project.presentationUrl && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Presentation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(project.presentationUrl!, 'presentation')}
                      >
                        {copiedField === 'presentation' ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                      <Link href={project.presentationUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <div className="flex gap-2">
            <Link href={`/dashboard/projects/${project.id}/code-quality`}>
              <Button
                variant="outline"
                className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white border-0"
              >
                <Zap className="w-4 h-4 mr-2" />
                Code Quality Reports
              </Button>
            </Link>
            {onAnalyzeCode && (
              <Button
                onClick={() => onAnalyzeCode(project)}
                disabled={isAnalyzing}
                variant="outline"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 disabled:from-green-300 disabled:to-emerald-300 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    New Analysis
                  </>
                )}
              </Button>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}