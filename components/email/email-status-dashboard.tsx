'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IRecipientData, EmailStatus, IEmailLog } from '@/lib/types';
import { getEmailLogs, retryFailedEmail } from '@/lib/actions';
import { toast } from '@/hooks/use-toast';
import {
  EmailStatusIndicator,
  EmailStatusBadge,
} from './email-status-indicator';
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react';

interface EmailStatusDashboardProps {
  eventId: string;
  participants: IRecipientData[];
  onEmailRetry?: () => void;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  notSent: number;
  bounced: number;
}

export function EmailStatusDashboard({
  eventId,
  participants,
  onEmailRetry,
}: EmailStatusDashboardProps) {
  const [emailLogs, setEmailLogs] = useState<IEmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryingEmails, setRetryingEmails] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<EmailStatus | 'all'>('all');

  useEffect(() => {
    loadEmailLogs();
  }, [eventId]);

  const loadEmailLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getEmailLogs(eventId);
      setEmailLogs(logs);
    } catch (error) {
      toast({
        title: 'Error Loading Logs',
        description: 'Failed to load email logs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryEmail = async (participantId: string) => {
    setRetryingEmails((prev) => new Set(prev).add(participantId));

    try {
      const result = await retryFailedEmail(eventId, participantId);

      if (result.success) {
        toast({
          title: 'Email Retry Sent',
          description: 'Email has been queued for retry',
          variant: 'default',
        });
        onEmailRetry?.();
        loadEmailLogs();
      } else {
        toast({
          title: 'Retry Failed',
          description: result.error || 'Failed to retry email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Retry Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setRetryingEmails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(participantId);
        return newSet;
      });
    }
  };

  const getEmailStats = (): EmailStats => {
    const stats: EmailStats = {
      total: participants.length,
      sent: 0,
      failed: 0,
      pending: 0,
      notSent: 0,
      bounced: 0,
    };

    participants.forEach((participant) => {
      const status = participant.emailStatus || 'not_sent';
      switch (status) {
        case 'sent':
          stats.sent++;
          break;
        case 'failed':
          stats.failed++;
          break;
        case 'pending':
          stats.pending++;
          break;
        case 'bounced':
          stats.bounced++;
          break;
        case 'not_sent':
        default:
          stats.notSent++;
          break;
      }
    });

    return stats;
  };

  const getFilteredParticipants = () => {
    if (filter === 'all') return participants;
    return participants.filter((p) => p.emailStatus === filter);
  };

  const getFailedParticipants = () => {
    return participants.filter((p) => p.emailStatus === 'failed');
  };

  const stats = getEmailStats();
  const filteredParticipants = getFilteredParticipants();
  const failedParticipants = getFailedParticipants();

  const getStatusIcon = (status: EmailStatus) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'bounced':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.sent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.failed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Not Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.notSent}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Failed Emails Alert */}
      {failedParticipants.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {failedParticipants.length} email(s) failed to send.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => setFilter('failed')}
            >
              View failed emails
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="participants" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="participants">Participants</TabsTrigger>
          <TabsTrigger value="logs">Email Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="participants" className="space-y-4">
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter by status:</span>
            <div className="flex gap-2">
              {(['all', 'sent', 'failed', 'pending', 'not_sent'] as const).map(
                (status) => (
                  <Button
                    key={status}
                    variant={filter === status ? 'default' : 'outline'}
                    size="sm"
                    className="capitalize px-4"
                    onClick={() => setFilter(status)}
                  >
                    {status === 'all'
                      ? 'All'
                      : status.replace('_', ' ').toUpperCase()}
                  </Button>
                )
              )}
            </div>
          </div>

          {/* Participants List */}
          <div className="space-y-2">
            {filteredParticipants.map((participant) => (
              <Card key={participant.certification_id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(participant.emailStatus || 'not_sent')}
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-gray-500">
                          {participant.email}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {participant.certification_id}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <EmailStatusBadge
                        status={participant.emailStatus || 'not_sent'}
                      />

                      {participant.emailStatus === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRetryEmail(participant.certification_id)
                          }
                          disabled={retryingEmails.has(
                            participant.certification_id
                          )}
                        >
                          <RefreshCw
                            className={`h-4 w-4 mr-1 ${
                              retryingEmails.has(participant.certification_id)
                                ? 'animate-spin'
                                : ''
                            }`}
                          />
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>

                  {participant.emailError && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {participant.emailError}
                    </div>
                  )}

                  {participant.lastEmailSent && (
                    <div className="mt-2 text-xs text-gray-500">
                      Last sent: {participant.lastEmailSent.toLocaleString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Email Logs</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEmailLogs}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            {emailLogs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No email logs found
              </div>
            ) : (
              emailLogs.map((log, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="font-medium">{log.emailAddress}</div>
                          <div className="text-sm text-gray-500">
                            {log.sentAt
                              ? log.sentAt.toLocaleString()
                              : 'Not sent'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <EmailStatusBadge status={log.status} />
                        {log.retryCount > 0 && (
                          <Badge variant="outline">
                            Retry {log.retryCount}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {log.errorMessage && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                        {log.errorMessage}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
