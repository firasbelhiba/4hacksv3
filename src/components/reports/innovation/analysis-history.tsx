'use client';

import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Eye, Archive, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface InnovationHistoryReport {
  id: string;
  score: number;
  noveltyScore: number;
  creativityScore: number;
  technicalInnovation: number;
  marketInnovation: number;
  implementationInnovation: number;
  patentPotential: boolean;
  status: string;
  isArchived: boolean;
  createdAt: string;
  processingTime: number;
  agentModel: string;
}

interface AnalysisHistoryProps {
  reports: InnovationHistoryReport[];
  currentReportId?: string;
  onViewReport: (reportId: string) => void;
  onArchiveReport?: (reportId: string) => void;
  onDeleteReport?: (reportId: string) => void;
  onCompareReports?: (reportId1: string, reportId2: string) => void;
}

export function AnalysisHistory({
  reports,
  currentReportId,
  onViewReport,
  onArchiveReport,
  onDeleteReport,
  onCompareReports
}: AnalysisHistoryProps) {
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getScoreTrend = (current: number, previous: number) => {
    const diff = current - previous;
    if (Math.abs(diff) < 0.5) return { icon: Minus, color: 'text-gray-500', text: 'No change' };
    if (diff > 0) return { icon: TrendingUp, color: 'text-green-600', text: `+${diff.toFixed(1)}` };
    return { icon: TrendingDown, color: 'text-red-600', text: diff.toFixed(1) };
  };

  const handleReportSelect = (reportId: string) => {
    setSelectedReports(prev => {
      if (prev.includes(reportId)) {
        return prev.filter(id => id !== reportId);
      }
      if (prev.length >= 2) {
        return [prev[1], reportId]; // Keep only last selected and new one
      }
      return [...prev, reportId];
    });
  };

  const handleCompare = () => {
    if (selectedReports.length === 2 && onCompareReports) {
      onCompareReports(selectedReports[0], selectedReports[1]);
    }
  };

  const activeReports = reports.filter(r => !r.isArchived);
  const archivedReports = reports.filter(r => r.isArchived);

  const renderReportsTable = (reportsList: InnovationHistoryReport[], showArchived = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <input
              type="checkbox"
              className="rounded"
              checked={false}
              onChange={() => {}}
              disabled={reportsList.length < 2}
            />
          </TableHead>
          <TableHead>Analysis Date</TableHead>
          <TableHead>Overall Score</TableHead>
          <TableHead>Novelty</TableHead>
          <TableHead>Technical</TableHead>
          <TableHead>Market</TableHead>
          <TableHead>Patent Potential</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reportsList.map((report, index) => {
          const isSelected = selectedReports.includes(report.id);
          const isCurrent = report.id === currentReportId;
          const previousReport = index < reportsList.length - 1 ? reportsList[index + 1] : null;
          const scoreTrend = previousReport ? getScoreTrend(report.score, previousReport.score) : null;

          return (
            <TableRow
              key={report.id}
              className={cn(
                'hover:bg-muted/50',
                isSelected && 'bg-blue-50 border-blue-200',
                isCurrent && 'bg-green-50 border-green-200'
              )}
            >
              <TableCell>
                <input
                  type="checkbox"
                  className="rounded"
                  checked={isSelected}
                  onChange={() => handleReportSelect(report.id)}
                  disabled={reportsList.length < 2}
                />
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{formatDate(report.createdAt)}</span>
                  {isCurrent && (
                    <Badge variant="secondary" className="w-fit mt-1 text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{report.score.toFixed(1)}</span>
                  {scoreTrend && (
                    <div className={cn('flex items-center gap-1', scoreTrend.color)}>
                      <scoreTrend.icon className="w-3 h-3" />
                      <span className="text-xs">{scoreTrend.text}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>{report.noveltyScore.toFixed(1)}</TableCell>
              <TableCell>{report.technicalInnovation.toFixed(1)}</TableCell>
              <TableCell>{report.marketInnovation.toFixed(1)}</TableCell>
              <TableCell>
                <Badge
                  variant={report.patentPotential ? "default" : "secondary"}
                  className={report.patentPotential ? "bg-purple-100 text-purple-800" : ""}
                >
                  {report.patentPotential ? 'High' : 'Low'}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDuration(report.processingTime)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewReport(report.id)}
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                  {!isCurrent && (
                    <>
                      {!showArchived && onArchiveReport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onArchiveReport(report.id)}
                        >
                          <Archive className="w-3 h-3" />
                        </Button>
                      )}
                      {onDeleteReport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteReport(report.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analysis History</h3>
          <p className="text-muted-foreground">
            Run multiple innovation analyses to see comparison and trends over time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Analysis History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {reports.length} total analyses
            </Badge>
            {selectedReports.length === 2 && onCompareReports && (
              <Button size="sm" onClick={handleCompare}>
                Compare Selected
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">
              Active Reports ({activeReports.length})
            </TabsTrigger>
            <TabsTrigger value="archived">
              Archived ({archivedReports.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="space-y-4">
            {activeReports.length > 0 ? (
              renderReportsTable(activeReports)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active reports found
              </div>
            )}
          </TabsContent>
          <TabsContent value="archived" className="space-y-4">
            {archivedReports.length > 0 ? (
              renderReportsTable(archivedReports, true)
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No archived reports found
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        {reports.length > 1 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-medium mb-3">Quick Comparison</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold">Highest Score</div>
                <div className="text-muted-foreground">
                  {Math.max(...reports.map(r => r.score)).toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Latest Score</div>
                <div className="text-muted-foreground">
                  {reports[0].score.toFixed(1)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Avg Processing</div>
                <div className="text-muted-foreground">
                  {formatDuration(reports.reduce((acc, r) => acc + r.processingTime, 0) / reports.length)}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold">Patent Potential</div>
                <div className="text-muted-foreground">
                  {reports.filter(r => r.patentPotential).length}/{reports.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AnalysisHistory;