'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface CertificateGenerationTabProps {
  recipientsCount: number;
  generating: boolean;
  onGenerate: () => void;
}

export function CertificateGenerationTab({
  recipientsCount,
  generating,
  onGenerate,
}: CertificateGenerationTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Generate Certificates
        </CardTitle>
        <CardDescription>
          Review your settings and generate all certificates as a downloadable
          ZIP file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {recipientsCount}
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
          onClick={onGenerate}
          disabled={generating || recipientsCount === 0}
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
              Generate & Download {recipientsCount} Certificates
            </div>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
