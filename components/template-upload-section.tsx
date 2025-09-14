'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { Progress } from '@/components/ui/progress';
import { FileImage, CheckCircle } from 'lucide-react';
import { saveTemplate } from '@/lib/actions';
import { IEvent } from '@/lib/types';

interface TemplateUploadSectionProps {
  event: IEvent | null;
  onTemplateUploaded: () => void;
  onBack?: () => void;
}

export function TemplateUploadSection({
  event,
  onTemplateUploaded,
  onBack,
}: TemplateUploadSectionProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleTemplateUpload = async (file: File) => {
    if (!event?._id) return;

    setTemplateFile(file);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);

      // Convert file to base64 on client side
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      // Create a simple object to pass to server action
      const templateData = {
        base64,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      };

      await saveTemplate(event._id.toString(), templateData);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadSuccess(true);

      // Call the callback to refresh the event data
      onTemplateUploaded();

      // Reset success message after 3 seconds
      setTimeout(() => {
        setUploadSuccess(false);
        setTemplateFile(null);
      }, 3000);
    } catch (error) {
      console.error('Error uploading template:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleTemplateRemove = () => {
    setTemplateFile(null);
    setUploadProgress(0);
  };

  const hasTemplate =
    event?.template.base64 && event.template.base64.length > 0;

  const templateUrl = event?.template.base64
    ? `data:image/png;base64,${event.template.base64}`
    : '';

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Event Selected
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please select an event from the sidebar to upload a template.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Template Upload
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a PNG image that will serve as your certificate template
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5" />
              Upload Certificate Template
            </CardTitle>
            <CardDescription>
              Upload a PNG image that will serve as your certificate template
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hasTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-800 dark:text-green-200">
                    Template uploaded: {event.template.originalName}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Want to use a different template? Upload a new one below.
                </div>
                <FileUpload
                  onFileSelect={handleTemplateUpload}
                  onFileRemove={handleTemplateRemove}
                  accept="image/png"
                  selectedFile={templateFile}
                  disabled={isUploading}
                />
              </div>
            ) : (
              <FileUpload
                onFileSelect={handleTemplateUpload}
                onFileRemove={handleTemplateRemove}
                accept="image/png"
                selectedFile={templateFile}
                disabled={isUploading}
              />
            )}

            {uploadProgress > 0 && uploadProgress < 100 && (
              <Progress value={uploadProgress} className="mt-4" />
            )}

            {uploadSuccess && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-green-50 dark:bg-green-900/20 mt-4">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">
                  Template updated successfully!
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Template Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Template Preview
          </h3>
          {hasTemplate ? (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
              <img
                src={templateUrl}
                alt="Certificate Template Preview"
                className="w-full h-auto max-h-96 object-contain"
              />
              <div className="p-4 bg-gray-50 dark:bg-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>File:</strong> {event.template.originalName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Uploaded:</strong>{' '}
                  {new Date(event.template.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
              <FileImage className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No template uploaded yet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Upload a template to see the preview
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      {hasTemplate && (
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              ← Back to Event Creation
            </button>
          )}
          <button
            onClick={onTemplateUploaded}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Template Adjustment →
          </button>
        </div>
      )}
    </div>
  );
}
