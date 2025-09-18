'use client';

import { useState, useEffect } from 'react';
import { IEvent, IEmailConfig, IEmailTemplate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Mail,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react';
import {
  testEmailConfiguration,
  updateEventEmailConfig,
  updateEventEmailTemplate,
} from '@/lib/actions';
import { toast } from '@/hooks/use-toast';

interface EmailConfigViewProps {
  event: IEvent;
  onBack: () => void;
  onConfigUpdate?: () => void;
}

export function EmailConfigView({
  event,
  onBack,
  onConfigUpdate,
}: EmailConfigViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [config, setConfig] = useState<IEmailConfig>({
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT || '587'),
    smtpSecure: false,
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'Certificate Generator',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || '',
    subjectTemplate: 'Your Certificate - {eventTitle}',
    enabled: process.env.EMAIL_ENABLED === 'true',
  });

  const [template, setTemplate] = useState<IEmailTemplate>({
    subject: 'Your Certificate - {eventTitle}',
    html: `
      <p>Dear {participantName},</p>
      <p>Congratulations! Your certificate for <strong>{eventTitle}</strong> is attached.</p>
      <p>Your Certificate ID is: <strong>{certificateId}</strong></p>
      <p>Thank you for your participation.</p>
      <p>Best regards,<br>The Certificate Generator Team</p>
    `,
    text: `
      Dear {participantName},

      Congratulations! Your certificate for {eventTitle} is attached.
      Your Certificate ID is: {certificateId}

      Thank you for your participation.

      Best regards,
      The Certificate Generator Team
    `,
  });

  useEffect(() => {
    if (event.emailConfig) {
      setConfig(event.emailConfig);
    }
    if (event.emailTemplate) {
      setTemplate(event.emailTemplate);
    }
  }, [event.emailConfig, event.emailTemplate]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testEmailConfiguration(config);
      setTestResult({
        success: result.success,
        message: result.success
          ? 'Connection successful!'
          : result.error || 'Connection failed',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsLoading(true);

    try {
      await updateEventEmailConfig(event._id!.toString(), config);
      await updateEventEmailTemplate(event._id!.toString(), template);

      toast({
        title: 'Configuration Saved',
        description: 'Email configuration has been updated successfully.',
        variant: 'default',
      });

      onConfigUpdate?.();
    } catch (error) {
      toast({
        title: 'Save Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof IEmailConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (field: keyof IEmailTemplate, value: string) => {
    setTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const getConfigStatus = () => {
    if (!config.smtpHost || !config.smtpUser) return 'not-configured';
    if (!config.enabled) return 'disabled';
    if (!config.smtpHost || !config.smtpUser) return 'incomplete';
    return 'configured';
  };

  const configStatus = getConfigStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Email Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure email settings for {event.title}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Configuration Status
          </CardTitle>
          <CardDescription>
            Current email configuration status for this event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {configStatus === 'configured' && (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              {configStatus === 'disabled' && (
                <XCircle className="h-5 w-5 text-yellow-500" />
              )}
              {configStatus === 'incomplete' && (
                <XCircle className="h-5 w-5 text-orange-500" />
              )}
              {configStatus === 'not-configured' && (
                <XCircle className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <p className="font-medium">
                  {configStatus === 'configured' &&
                    'Email is configured and enabled'}
                  {configStatus === 'disabled' &&
                    'Email is configured but disabled'}
                  {configStatus === 'incomplete' &&
                    'Email configuration is incomplete'}
                  {configStatus === 'not-configured' &&
                    'Email is not configured'}
                </p>
                <p className="text-sm text-gray-500">
                  {configStatus === 'configured' &&
                    'Ready to send emails to participants'}
                  {configStatus === 'disabled' &&
                    'Enable email sending to start sending certificates'}
                  {configStatus === 'incomplete' &&
                    'Complete the configuration to enable email sending'}
                  {configStatus === 'not-configured' &&
                    'Set up email configuration to send certificates via email'}
                </p>
              </div>
            </div>
            <Badge
              variant={
                configStatus === 'configured'
                  ? 'default'
                  : configStatus === 'disabled'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {configStatus === 'configured' && 'Ready'}
              {configStatus === 'disabled' && 'Disabled'}
              {configStatus === 'incomplete' && 'Incomplete'}
              {configStatus === 'not-configured' && 'Not Set Up'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure SMTP settings and email templates for certificate
            distribution
          </CardDescription>
        </CardHeader>
        <CardContent className="w-full">
          <Tabs defaultValue="smtp" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
              <TabsTrigger value="templates">Email Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="smtp" className="space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enabled" className="text-sm font-medium">
                    Enable Email Sending
                  </Label>
                  <Switch
                    id="enabled"
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      handleConfigChange('enabled', checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={config.smtpHost}
                      onChange={(e) =>
                        handleConfigChange('smtpHost', e.target.value)
                      }
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={config.smtpPort}
                      onChange={(e) =>
                        handleConfigChange('smtpPort', parseInt(e.target.value))
                      }
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="smtpSecure"
                    checked={config.smtpSecure}
                    onCheckedChange={(checked) =>
                      handleConfigChange('smtpSecure', checked)
                    }
                  />
                  <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={config.smtpUser}
                      onChange={(e) =>
                        handleConfigChange('smtpUser', e.target.value)
                      }
                      placeholder="your-email@gmail.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPass">SMTP Password</Label>
                    <Input
                      id="smtpPass"
                      type="password"
                      value={config.smtpPass}
                      onChange={(e) =>
                        handleConfigChange('smtpPass', e.target.value)
                      }
                      placeholder="Your app password"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={config.fromName}
                      onChange={(e) =>
                        handleConfigChange('fromName', e.target.value)
                      }
                      placeholder="Certificate Generator"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromAddress">From Email Address</Label>
                    <Input
                      id="fromAddress"
                      type="email"
                      value={config.fromAddress}
                      onChange={(e) =>
                        handleConfigChange('fromAddress', e.target.value)
                      }
                      placeholder="noreply@yourdomain.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subjectTemplate">Subject Template</Label>
                  <Input
                    id="subjectTemplate"
                    value={config.subjectTemplate}
                    onChange={(e) =>
                      handleConfigChange('subjectTemplate', e.target.value)
                    }
                    placeholder="Your Certificate - {eventTitle}"
                  />
                  <p className="text-xs text-gray-500">
                    Available variables: {'{eventTitle}'}, {'{participantName}'}
                    , {'{certificateId}'}
                  </p>
                </div>

                {testResult && (
                  <Alert
                    variant={testResult.success ? 'default' : 'destructive'}
                  >
                    <AlertDescription>{testResult.message}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting || !config.smtpHost || !config.smtpUser}
                    variant="outline"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left side - Input fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateSubject">Email Subject</Label>
                    <Input
                      id="templateSubject"
                      value={template.subject}
                      onChange={(e) =>
                        handleTemplateChange('subject', e.target.value)
                      }
                      placeholder="Your Certificate - {eventTitle}"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateHtml">HTML Template</Label>
                    <Textarea
                      id="templateHtml"
                      value={template.html}
                      onChange={(e) =>
                        handleTemplateChange('html', e.target.value)
                      }
                      placeholder="HTML email template..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Available variables: {'{eventTitle}'},{' '}
                      {'{participantName}'}, {'{certificateId}'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="templateText">
                      Plain Text Template (Fallback)
                    </Label>
                    <Textarea
                      id="templateText"
                      value={template.text}
                      onChange={(e) =>
                        handleTemplateChange('text', e.target.value)
                      }
                      placeholder="Plain text email template..."
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Fallback template for email clients that don't support
                      HTML or when HTML rendering fails. Used for better
                      accessibility and compatibility.
                    </p>
                  </div>
                </div>

                {/* Right side - Preview */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Live Preview</Label>
                    <p className="text-xs text-gray-500">
                      Preview how your email will look with sample data
                    </p>
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-50 h-full">
                    <div className="space-y-3 mb-4">
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          Subject:
                        </div>
                        <div className="text-sm text-gray-800">
                          {template.subject
                            .replace('{eventTitle}', 'Sample Event 2024')
                            .replace('{participantName}', 'John Doe')
                            .replace('{certificateId}', 'CERT-2024-001')}
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-1">
                          From:
                        </div>
                        <div className="text-sm text-gray-800">
                          {config.fromName} &lt;
                          {config.fromAddress || 'noreply@example.com'}&gt;
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          HTML Content:
                        </div>
                        <div
                          className="border rounded p-3 bg-white min-h-[150px] max-h-[250px] overflow-y-auto text-sm"
                          dangerouslySetInnerHTML={{
                            __html: template.html
                              .replace(/\{eventTitle\}/g, 'Sample Event 2024')
                              .replace(/\{participantName\}/g, 'John Doe')
                              .replace(/\{certificateId\}/g, 'CERT-2024-001'),
                          }}
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-600 mb-2">
                          Plain Text Version:
                        </div>
                        <div className="border rounded p-3 bg-gray-100 text-xs font-mono whitespace-pre-wrap max-h-[100px] overflow-y-auto">
                          {template.text
                            .replace(/\{eventTitle\}/g, 'Sample Event 2024')
                            .replace(/\{participantName\}/g, 'John Doe')
                            .replace(/\{certificateId\}/g, 'CERT-2024-001')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveConfig} disabled={isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Event Information */}
      <Card>
        <CardHeader>
          <CardTitle>Event Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Event Title:
              </span>
              <p className="text-gray-900 dark:text-gray-100">{event.title}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Participants:
              </span>
              <p className="text-gray-900 dark:text-gray-100">
                {event.participants.length}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Event Date:
              </span>
              <p className="text-gray-900 dark:text-gray-100">
                {new Date(event.eventDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Status:
              </span>
              <p className="text-gray-900 dark:text-gray-100 capitalize">
                {event.status}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
