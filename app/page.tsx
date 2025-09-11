'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { CertificateCanvas } from '@/components/certificate-canvas';
import { FontCustomizer } from '@/components/font-customizer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ITextConfig, IRecipientData } from '@/lib/types';
import { parseCSV } from '@/lib/csv-utils';
import { Download, FileImage, FileText, Settings, Users } from 'lucide-react';

export default function Home() {
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [templateUrl, setTemplateUrl] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [recipients, setRecipients] = useState<IRecipientData[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [nameConfig, setNameConfig] = useState<ITextConfig>({
    x: 400,
    y: 300,
    fontFamily: 'Arial',
    fontSize: 36,
    color: '#000000',
  });

  const [idConfig, setIdConfig] = useState<ITextConfig>({
    x: 400,
    y: 500,
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#666666',
  });

  const handleTemplateUpload = async (file: File) => {
    setError(null);
    setTemplateFile(file);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setTemplateUrl(result.url);
        setUploadProgress(100);
        setCurrentStep(2);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed. Please try again.');
    }
  };

  const handleCSVUpload = (file: File) => {
    setError(null);
    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedRecipients = parseCSV(content);
        setRecipients(parsedRecipients);
        setCurrentStep(4);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to parse CSV file'
        );
      }
    };
    reader.readAsText(file);
  };

  const handleGenerateCertificates = async () => {
    if (!templateUrl || recipients.length === 0 || !nameConfig || !idConfig) {
      setError(
        'Please complete all configuration steps before generating certificates.'
      );
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // Safely read CSV file with error handling
      let csvData = '';
      if (csvFile) {
        try {
          csvData = await csvFile.text();
        } catch (csvError) {
          setError('Failed to read CSV file. Please try uploading again.');
          return;
        }
      }

      const response = await fetch('/api/generate-certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateUrl,
          csvData,
          nameConfig,
          idConfig,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();

        // Check file size (warn if > 100MB)
        if (blob.size > 100 * 1024 * 1024) {
          setError(
            'Generated file is very large. This may cause performance issues.'
          );
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'certificates.zip';
        document.body.appendChild(a);
        a.click();

        // Clean up immediately to prevent memory leaks
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          if (document.body.contains(a)) {
            document.body.removeChild(a);
          }
        }, 100);
      } else {
        // Handle different response types
        let errorMessage = 'Generation failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            errorMessage = `Server error: ${response.status} ${response.statusText}`;
          }
        }
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to generate certificates. Please try again.';
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'complete';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Certificate Generator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Upload your certificate template, customize the layout, and generate
            personalized certificates in bulk
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8 space-x-4">
          {[
            { num: 1, title: 'Upload Template', icon: FileImage },
            { num: 2, title: 'Customize Layout', icon: Settings },
            { num: 3, title: 'Upload Recipients', icon: Users },
            { num: 4, title: 'Generate & Download', icon: Download },
          ].map((step) => {
            const status = getStepStatus(step.num);
            const Icon = step.icon;
            return (
              <div key={step.num} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                    status === 'complete'
                      ? 'bg-green-500 border-green-500 text-white'
                      : status === 'current'
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <p
                    className={`text-sm font-medium ${
                      status !== 'upcoming'
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
                {step.num < 4 && (
                  <div
                    className={`w-8 h-0.5 ml-6 ${
                      status === 'complete' ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <AlertDescription className="text-red-800 dark:text-red-200">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="1" disabled={currentStep < 1}>
              Template
            </TabsTrigger>
            <TabsTrigger value="2" disabled={currentStep < 2}>
              Layout
            </TabsTrigger>
            <TabsTrigger value="3" disabled={currentStep < 3}>
              Recipients
            </TabsTrigger>
            <TabsTrigger value="4" disabled={currentStep < 4}>
              Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="w-5 h-5" />
                  Upload Certificate Template
                </CardTitle>
                <CardDescription>
                  Upload a PNG image that will serve as your certificate
                  template
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleTemplateUpload}
                  onFileRemove={() => {
                    setTemplateFile(null);
                    setTemplateUrl('');
                    setCurrentStep(1);
                  }}
                  accept="image/png"
                  selectedFile={templateFile}
                  disabled={generating}
                />
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <Progress value={uploadProgress} className="mt-4" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="2" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Certificate Preview</CardTitle>
                  <CardDescription>
                    Click on the template to position text elements. Drag the
                    indicators to fine-tune positions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {templateUrl && (
                    <CertificateCanvas
                      templateUrl={templateUrl}
                      nameConfig={nameConfig}
                      idConfig={idConfig}
                      onPositionChange={(type, position) => {
                        if (type === 'name') {
                          setNameConfig({ ...nameConfig, ...position });
                        } else {
                          setIdConfig({ ...idConfig, ...position });
                        }
                      }}
                      className="w-full h-96"
                    />
                  )}
                </CardContent>
              </Card>

              <FontCustomizer
                label="Recipient Name"
                config={nameConfig}
                onChange={setNameConfig}
              />

              <FontCustomizer
                label="Certificate ID"
                config={idConfig}
                onChange={setIdConfig}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(3)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continue to Recipients
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="3" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Upload Recipients Data
                </CardTitle>
                <CardDescription>
                  Upload a CSV file with recipient names and certificate IDs.
                  The file must have 'name' and 'certification_id' columns.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFileSelect={handleCSVUpload}
                  onFileRemove={() => {
                    setCsvFile(null);
                    setRecipients([]);
                    setCurrentStep(3);
                  }}
                  accept=".csv"
                  selectedFile={csvFile}
                  disabled={generating}
                />

                {recipients.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">
                      Preview ({recipients.length} recipients)
                    </h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium">Name</th>
                            <th className="text-left p-3 font-medium">
                              Certificate ID
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {recipients.slice(0, 10).map((recipient, index) => (
                            <tr key={index} className="border-t">
                              <td className="p-3">{recipient.name}</td>
                              <td className="p-3 text-gray-600 dark:text-gray-400">
                                {recipient.certification_id}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {recipients.length > 10 && (
                        <div className="p-3 text-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-800">
                          ... and {recipients.length - 10} more recipients
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="4" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Generate Certificates
                </CardTitle>
                <CardDescription>
                  Review your settings and generate all certificates as a
                  downloadable ZIP file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {recipients.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Recipients
                    </div>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      PNG
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Format
                    </div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ZIP
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Download
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateCertificates}
                  disabled={generating || recipients.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                >
                  {generating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generating Certificates...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5" />
                      Generate & Download {recipients.length} Certificates
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
