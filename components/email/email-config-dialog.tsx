// 'use client';

// import { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import { Textarea } from '@/components/ui/textarea';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { IEmailConfig, IEmailTemplate } from '@/lib/types';
// import {
//   testEmailConfiguration,
//   updateEventEmailConfig,
//   updateEventEmailTemplate,
// } from '@/lib/actions';
// import { toast } from '@/hooks/use-toast';
// import { Settings, TestTube, Save, Mail, FileText } from 'lucide-react';

// interface EmailConfigDialogProps {
//   eventId: string;
//   currentConfig?: IEmailConfig;
//   currentTemplate?: IEmailTemplate;
//   onConfigUpdate?: () => void;
//   children?: React.ReactNode;
// }

// export function EmailConfigDialog({
//   eventId,
//   currentConfig,
//   currentTemplate,
//   onConfigUpdate,
//   children,
// }: EmailConfigDialogProps) {
//   const [open, setOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isTesting, setIsTesting] = useState(false);
//   const [testResult, setTestResult] = useState<{
//     success: boolean;
//     message: string;
//   } | null>(null);

//   const [config, setConfig] = useState<IEmailConfig>({
//     smtpHost: '',
//     smtpPort: 587,
//     smtpSecure: false,
//     smtpUser: '',
//     smtpPass: '',
//     fromName: 'Certificate Generator',
//     fromAddress: '',
//     subjectTemplate: 'Your Certificate - {eventTitle}',
//     enabled: false,
//   });

//   const [template, setTemplate] = useState<IEmailTemplate>({
//     subject: 'Your Certificate - {eventTitle}',
//     html: `
//       <p>Dear {participantName},</p>
//       <p>Congratulations! Your certificate for <strong>{eventTitle}</strong> is attached.</p>
//       <p>Your Certificate ID is: <strong>{certificateId}</strong></p>
//       <p>Thank you for your participation.</p>
//       <p>Best regards,<br>The Certificate Generator Team</p>
//     `,
//     text: `
//       Dear {participantName},

//       Congratulations! Your certificate for {eventTitle} is attached.
//       Your Certificate ID is: {certificateId}

//       Thank you for your participation.

//       Best regards,
//       The Certificate Generator Team
//     `,
//   });

//   useEffect(() => {
//     if (currentConfig) {
//       setConfig(currentConfig);
//     }
//     if (currentTemplate) {
//       setTemplate(currentTemplate);
//     }
//   }, [currentConfig, currentTemplate]);

//   const handleTestConnection = async () => {
//     setIsTesting(true);
//     setTestResult(null);

//     try {
//       const result = await testEmailConfiguration(config);
//       setTestResult({
//         success: result.success,
//         message: result.success
//           ? 'Connection successful!'
//           : result.error || 'Connection failed',
//       });
//     } catch (error) {
//       setTestResult({
//         success: false,
//         message:
//           error instanceof Error ? error.message : 'Unknown error occurred',
//       });
//     } finally {
//       setIsTesting(false);
//     }
//   };

//   const handleSaveConfig = async () => {
//     setIsLoading(true);

//     try {
//       await updateEventEmailConfig(eventId, config);
//       await updateEventEmailTemplate(eventId, template);

//       toast({
//         title: 'Configuration Saved',
//         description: 'Email configuration has been updated successfully.',
//         variant: 'default',
//       });

//       onConfigUpdate?.();
//       setOpen(false);
//     } catch (error) {
//       toast({
//         title: 'Save Failed',
//         description:
//           error instanceof Error
//             ? error.message
//             : 'Failed to save configuration',
//         variant: 'destructive',
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleConfigChange = (field: keyof IEmailConfig, value: any) => {
//     setConfig((prev) => ({ ...prev, [field]: value }));
//   };

//   const handleTemplateChange = (field: keyof IEmailTemplate, value: string) => {
//     setTemplate((prev) => ({ ...prev, [field]: value }));
//   };

//   return (
//     <Dialog open={open} onOpenChange={setOpen}>
//       <DialogTrigger asChild>
//         {children || (
//           <Button variant="outline" size="sm">
//             <Settings className="h-4 w-4 mr-2" />
//             Email Settings
//           </Button>
//         )}
//       </DialogTrigger>
//       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <Mail className="h-5 w-5" />
//             Email Configuration
//           </DialogTitle>
//           <DialogDescription>
//             Configure SMTP settings and email templates for certificate
//             distribution.
//           </DialogDescription>
//         </DialogHeader>

//         <Tabs defaultValue="smtp" className="w-full">
//           <TabsList className="grid w-full grid-cols-2">
//             <TabsTrigger value="smtp">SMTP Settings</TabsTrigger>
//             <TabsTrigger value="templates">Email Templates</TabsTrigger>
//           </TabsList>

//           <TabsContent value="smtp" className="space-y-6">
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <Label htmlFor="enabled" className="text-sm font-medium">
//                   Enable Email Sending
//                 </Label>
//                 <Switch
//                   id="enabled"
//                   checked={config.enabled}
//                   onCheckedChange={(checked) =>
//                     handleConfigChange('enabled', checked)
//                   }
//                 />
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="smtpHost">SMTP Host</Label>
//                   <Input
//                     id="smtpHost"
//                     value={config.smtpHost}
//                     onChange={(e) =>
//                       handleConfigChange('smtpHost', e.target.value)
//                     }
//                     placeholder="smtp.gmail.com"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="smtpPort">SMTP Port</Label>
//                   <Input
//                     id="smtpPort"
//                     type="number"
//                     value={config.smtpPort}
//                     onChange={(e) =>
//                       handleConfigChange('smtpPort', parseInt(e.target.value))
//                     }
//                     placeholder="587"
//                   />
//                 </div>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Switch
//                   id="smtpSecure"
//                   checked={config.smtpSecure}
//                   onCheckedChange={(checked) =>
//                     handleConfigChange('smtpSecure', checked)
//                   }
//                 />
//                 <Label htmlFor="smtpSecure">Use SSL/TLS</Label>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="smtpUser">SMTP Username</Label>
//                   <Input
//                     id="smtpUser"
//                     value={config.smtpUser}
//                     onChange={(e) =>
//                       handleConfigChange('smtpUser', e.target.value)
//                     }
//                     placeholder="your-email@gmail.com"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="smtpPass">SMTP Password</Label>
//                   <Input
//                     id="smtpPass"
//                     type="password"
//                     value={config.smtpPass}
//                     onChange={(e) =>
//                       handleConfigChange('smtpPass', e.target.value)
//                     }
//                     placeholder="Your app password"
//                   />
//                 </div>
//               </div>

//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="fromName">From Name</Label>
//                   <Input
//                     id="fromName"
//                     value={config.fromName}
//                     onChange={(e) =>
//                       handleConfigChange('fromName', e.target.value)
//                     }
//                     placeholder="Certificate Generator"
//                   />
//                 </div>
//                 <div className="space-y-2">
//                   <Label htmlFor="fromAddress">From Email Address</Label>
//                   <Input
//                     id="fromAddress"
//                     type="email"
//                     value={config.fromAddress}
//                     onChange={(e) =>
//                       handleConfigChange('fromAddress', e.target.value)
//                     }
//                     placeholder="noreply@yourdomain.com"
//                   />
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="subjectTemplate">Subject Template</Label>
//                 <Input
//                   id="subjectTemplate"
//                   value={config.subjectTemplate}
//                   onChange={(e) =>
//                     handleConfigChange('subjectTemplate', e.target.value)
//                   }
//                   placeholder="Your Certificate - {eventTitle}"
//                 />
//                 <p className="text-xs text-gray-500">
//                   Available variables: {'{eventTitle}'}, {'{participantName}'},{' '}
//                   {'{certificateId}'}
//                 </p>
//               </div>

//               {testResult && (
//                 <Alert variant={testResult.success ? 'default' : 'destructive'}>
//                   <AlertDescription>{testResult.message}</AlertDescription>
//                 </Alert>
//               )}

//               <div className="flex justify-end">
//                 <Button
//                   onClick={handleTestConnection}
//                   disabled={isTesting || !config.smtpHost || !config.smtpUser}
//                   variant="outline"
//                 >
//                   <TestTube className="h-4 w-4 mr-2" />
//                   {isTesting ? 'Testing...' : 'Test Connection'}
//                 </Button>
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="templates" className="space-y-6">
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//               {/* Left side - Input fields */}
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <Label htmlFor="templateSubject">Email Subject</Label>
//                   <Input
//                     id="templateSubject"
//                     value={template.subject}
//                     onChange={(e) =>
//                       handleTemplateChange('subject', e.target.value)
//                     }
//                     placeholder="Your Certificate - {eventTitle}"
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="templateHtml">HTML Template</Label>
//                   <Textarea
//                     id="templateHtml"
//                     value={template.html}
//                     onChange={(e) =>
//                       handleTemplateChange('html', e.target.value)
//                     }
//                     placeholder="HTML email template..."
//                     rows={8}
//                     className="font-mono text-sm"
//                   />
//                   <p className="text-xs text-gray-500">
//                     Available variables: {'{eventTitle}'}, {'{participantName}'}
//                     , {'{certificateId}'}
//                   </p>
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="templateText">
//                     Plain Text Template (Fallback)
//                   </Label>
//                   <Textarea
//                     id="templateText"
//                     value={template.text}
//                     onChange={(e) =>
//                       handleTemplateChange('text', e.target.value)
//                     }
//                     placeholder="Plain text email template..."
//                     rows={6}
//                     className="font-mono text-sm"
//                   />
//                   <p className="text-xs text-gray-500">
//                     Fallback template for email clients that don't support HTML
//                     or when HTML rendering fails. Used for better accessibility
//                     and compatibility.
//                   </p>
//                 </div>
//               </div>

//               {/* Right side - Preview */}
//               <div className="space-y-4">
//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">Live Preview</Label>
//                   <p className="text-xs text-gray-500">
//                     Preview how your email will look with sample data
//                   </p>
//                 </div>

//                 <div className="border rounded-lg p-4 bg-gray-50 h-full">
//                   <div className="space-y-3 mb-4">
//                     <div>
//                       <div className="text-xs font-medium text-gray-600 mb-1">
//                         Subject:
//                       </div>
//                       <div className="text-sm text-gray-800">
//                         {template.subject
//                           .replace('{eventTitle}', 'Sample Event 2024')
//                           .replace('{participantName}', 'John Doe')
//                           .replace('{certificateId}', 'CERT-2024-001')}
//                       </div>
//                     </div>

//                     <div>
//                       <div className="text-xs font-medium text-gray-600 mb-1">
//                         From:
//                       </div>
//                       <div className="text-sm text-gray-800">
//                         {config.fromName} &lt;
//                         {config.fromAddress || 'noreply@example.com'}&gt;
//                       </div>
//                     </div>
//                   </div>

//                   <div className="space-y-3">
//                     <div>
//                       <div className="text-xs font-medium text-gray-600 mb-2">
//                         HTML Content:
//                       </div>
//                       <div
//                         className="border rounded p-3 bg-white min-h-[150px] max-h-[250px] overflow-y-auto text-sm"
//                         dangerouslySetInnerHTML={{
//                           __html: template.html
//                             .replace(/\{eventTitle\}/g, 'Sample Event 2024')
//                             .replace(/\{participantName\}/g, 'John Doe')
//                             .replace(/\{certificateId\}/g, 'CERT-2024-001'),
//                         }}
//                       />
//                     </div>

//                     <div>
//                       <div className="text-xs font-medium text-gray-600 mb-2">
//                         Plain Text Version:
//                       </div>
//                       <div className="border rounded p-3 bg-gray-100 text-xs font-mono whitespace-pre-wrap max-h-[100px] overflow-y-auto">
//                         {template.text
//                           .replace(/\{eventTitle\}/g, 'Sample Event 2024')
//                           .replace(/\{participantName\}/g, 'John Doe')
//                           .replace(/\{certificateId\}/g, 'CERT-2024-001')}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </TabsContent>
//         </Tabs>

//         <DialogFooter>
//           <Button variant="outline" onClick={() => setOpen(false)}>
//             Cancel
//           </Button>
//           <Button onClick={handleSaveConfig} disabled={isLoading}>
//             <Save className="h-4 w-4 mr-2" />
//             {isLoading ? 'Saving...' : 'Save Configuration'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
