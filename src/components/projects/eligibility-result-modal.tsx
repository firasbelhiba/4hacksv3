'use client';

import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Shield, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EligibilityResult {
  eligible: boolean;
  reason: string;
  repositoryStatus: string;
  checks?: {
    hasGithubUrl?: boolean;
    hasDescription?: boolean;
    hasTeamMembers?: boolean;
    trackEligibility?: {
      eligible: boolean;
      message: string;
      criteria?: {
        focus?: string;
        requirements?: string[];
      };
    };
  };
}

interface EligibilityResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EligibilityResult | null;
  error: string | null;
  projectName: string;
}

export function EligibilityResultModal({
  isOpen,
  onClose,
  result,
  error,
  projectName
}: EligibilityResultModalProps) {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]" style={{ margin: 0, padding: '1rem' }}>
      <div className="bg-background rounded-lg shadow-2xl overflow-y-auto" style={{ width: '90vw', maxWidth: '600px', maxHeight: '80vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              error
                ? 'bg-red-100'
                : result?.eligible
                  ? 'bg-green-100'
                  : 'bg-red-100'
            }`}>
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-600" />
              ) : result?.eligible ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">Eligibility Check Results</h2>
              <p className="text-sm text-muted-foreground">{projectName}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            /* Error State */
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  Check Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-4">{error}</p>
                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">
                    <strong>What this means:</strong> The eligibility check could not be completed due to a technical issue.
                    Please try again or contact support if the problem persists.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            <>
              {/* Status Card */}
              <Card className={`mb-6 ${
                result.eligible
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${
                    result.eligible ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.eligible ? (
                      <>
                        <CheckCircle className="w-6 h-6" />
                        Project is ELIGIBLE
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-6 h-6" />
                        Project is NOT ELIGIBLE
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Main Result */}
                    <div>
                      <p className="text-sm font-medium mb-2">Result Summary:</p>
                      <p className={`text-sm ${
                        result.eligible ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.reason}
                      </p>
                    </div>

                    {/* Repository Status */}
                    <div>
                      <p className="text-sm font-medium mb-2">Repository Status:</p>
                      <Badge
                        variant="outline"
                        className={
                          result.repositoryStatus.toLowerCase().includes('accessible') ||
                          result.repositoryStatus.toLowerCase().includes('valid')
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-orange-100 text-orange-800 border-orange-200'
                        }
                      >
                        {result.repositoryStatus}
                      </Badge>
                    </div>

                    {/* Detailed Checks */}
                    {result.checks && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">Eligibility Checks:</p>
                        <div className="space-y-2">
                          {result.checks.hasGithubUrl !== undefined && (
                            <div className="flex items-center gap-2">
                              {result.checks.hasGithubUrl ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm">GitHub URL provided</span>
                            </div>
                          )}
                          {result.checks.hasDescription !== undefined && (
                            <div className="flex items-center gap-2">
                              {result.checks.hasDescription ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm">Project description provided</span>
                            </div>
                          )}
                          {result.checks.hasTeamMembers !== undefined && (
                            <div className="flex items-center gap-2">
                              {result.checks.hasTeamMembers ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <span className="text-sm">Team members listed</span>
                            </div>
                          )}
                          {result.checks.trackEligibility && (
                            <div className="flex items-start gap-2">
                              {result.checks.trackEligibility.eligible ? (
                                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              )}
                              <div>
                                <span className="text-sm">Track eligibility: {result.checks.trackEligibility.message}</span>
                                {result.checks.trackEligibility.criteria && (
                                  <div className="mt-2 ml-2 text-xs text-muted-foreground">
                                    {result.checks.trackEligibility.criteria.focus && (
                                      <p className="mb-1"><strong>Focus:</strong> {result.checks.trackEligibility.criteria.focus}</p>
                                    )}
                                    {result.checks.trackEligibility.criteria.requirements && result.checks.trackEligibility.criteria.requirements.length > 0 && (
                                      <div>
                                        <strong>Requirements:</strong>
                                        <ul className="mt-1 space-y-0.5 ml-4">
                                          {result.checks.trackEligibility.criteria.requirements.map((req, idx) => (
                                            <li key={idx}>{req}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Next Steps */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.eligible ? (
                    <div className="space-y-3">
                      <p className="text-sm text-green-700 mb-3">
                        ✅ Your project meets the basic eligibility requirements and is ready for further review.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">Recommended next steps:</p>
                        <ul className="text-sm text-blue-700 space-y-1">
                          <li>• Run Code Quality Review to assess technical implementation</li>
                          <li>• Run Coherence Review to verify track alignment</li>
                          <li>• Run Innovation Review to evaluate creative aspects</li>
                          <li>• Run Hedera Technology Review (if applicable)</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-700 mb-3">
                        ❌ Your project does not currently meet the eligibility requirements.
                      </p>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-sm text-orange-800 font-medium mb-2">Action required:</p>
                        <ul className="text-sm text-orange-700 space-y-1">
                          <li>• Address the issues mentioned in the result summary</li>
                          <li>• Ensure your repository is publicly accessible</li>
                          <li>• Verify all submission requirements are met</li>
                          <li>• Run the eligibility check again after making fixes</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/50">
          {result?.eligible && (
            <p className="text-xs text-muted-foreground mr-auto">
              Continue with other review types from the Review menu
            </p>
          )}
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );

  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}