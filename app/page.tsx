'use client';

import { useState, useEffect } from 'react';
import { TemplateUploadTab } from '@/components/template-upload-tab';
import { LayoutCustomizationTab } from '@/components/layout-customization-tab';
import { RecipientsUploadTab } from '@/components/recipients-upload-tab';
import { CertificateGenerationTab } from '@/components/certificate-generation-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ITextConfig, IRecipientData } from '@/lib/types';
import { parseCSV } from '@/lib/csv-utils';
import { FileImage, Settings, Users, Download } from 'lucide-react';

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
    textAlign: 'center',
  });

  const [idConfig, setIdConfig] = useState<ITextConfig>({
    x: 400,
    y: 500,
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#666666',
    textAlign: 'center',
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

        <Tabs
          value={currentStep.toString()}
          onValueChange={(value) => setCurrentStep(parseInt(value))}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger
              value="1"
              className={`relative ${templateUrl ? '' : ''}`}
            >
              Template
              {templateUrl && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="2"
              className={`relative ${nameConfig && idConfig ? '' : ''}`}
            >
              Layout
              {templateUrl && nameConfig && idConfig && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="3"
              className={`relative ${recipients.length > 0 ? '' : ''}`}
            >
              Recipients
              {recipients.length > 0 && (
                <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="4"
              className={`relative ${generating ? '' : ''}`}
            >
              Generate
            </TabsTrigger>
          </TabsList>

          <TabsContent value="1" className="space-y-6">
            <TemplateUploadTab
              templateFile={templateFile}
              uploadProgress={uploadProgress}
              generating={generating}
              onTemplateUpload={handleTemplateUpload}
              onTemplateRemove={() => {
                setTemplateFile(null);
                setTemplateUrl('');
                setCurrentStep(1);
              }}
            />
          </TabsContent>

          <TabsContent value="2" className="space-y-6">
            {!templateUrl && (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Please upload a template first before customizing the layout.
                </AlertDescription>
              </Alert>
            )}
            <LayoutCustomizationTab
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
              onNameConfigChange={setNameConfig}
              onIdConfigChange={setIdConfig}
              onContinue={() => setCurrentStep(3)}
            />
          </TabsContent>

          <TabsContent value="3" className="space-y-6">
            <RecipientsUploadTab
              csvFile={csvFile}
              recipients={recipients}
              generating={generating}
              onCSVUpload={handleCSVUpload}
              onCSVRemove={() => {
                setCsvFile(null);
                setRecipients([]);
                setCurrentStep(3);
              }}
            />
          </TabsContent>

          <TabsContent value="4" className="space-y-6">
            {(!templateUrl || recipients.length === 0) && (
              <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  {!templateUrl && recipients.length === 0
                    ? 'Please complete all previous steps: upload a template and recipient data.'
                    : !templateUrl
                    ? 'Please upload a template first.'
                    : 'Please upload recipient data first.'}
                </AlertDescription>
              </Alert>
            )}
            <CertificateGenerationTab
              recipientsCount={recipients.length}
              generating={generating}
              onGenerate={handleGenerateCertificates}
              disableGenerate={
                !templateUrl ||
                recipients.length === 0 ||
                !nameConfig ||
                !idConfig
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
