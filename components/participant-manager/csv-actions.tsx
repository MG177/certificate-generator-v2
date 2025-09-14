'use client';

import { Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CSVActionsProps {
  onDownload: () => void;
  onUpload: () => void;
  hasParticipants: boolean;
  isUploading?: boolean;
}

export function CSVActions({
  onDownload,
  onUpload,
  hasParticipants,
  isUploading = false,
}: CSVActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        onClick={onDownload}
        disabled={isUploading}
        className="flex items-center gap-2"
        data-testid="download-csv-button"
      >
        <Download className="w-4 h-4" />
        Download CSV Template
      </Button>
      <Button
        onClick={onUpload}
        disabled={isUploading}
        className="flex items-center gap-2"
        data-testid="upload-csv-button"
      >
        <Upload className="w-4 h-4" />
        Upload CSV
      </Button>
    </div>
  );
}
