'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CertificateCanvas } from '@/components/certificate-canvas';
import { FontCustomizer } from '@/components/font-customizer';
import { ITextConfig } from '@/lib/types';

interface LayoutCustomizationTabProps {
  templateUrl: string;
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  onPositionChange: (
    type: 'name' | 'id',
    position: Partial<ITextConfig>
  ) => void;
  onNameConfigChange: (config: ITextConfig) => void;
  onIdConfigChange: (config: ITextConfig) => void;
  onContinue: () => void;
}

export function LayoutCustomizationTab({
  templateUrl,
  nameConfig,
  idConfig,
  onPositionChange,
  onNameConfigChange,
  onIdConfigChange,
  onContinue,
}: LayoutCustomizationTabProps) {
  return (
    <div className="space-y-6">
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
                onPositionChange={onPositionChange}
                className="w-full h-96"
              />
            )}
          </CardContent>
        </Card>

        <FontCustomizer
          label="Recipient Name"
          config={nameConfig}
          onChange={onNameConfigChange}
        />

        <FontCustomizer
          label="Certificate ID"
          config={idConfig}
          onChange={onIdConfigChange}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700">
          Continue to Recipients
        </Button>
      </div>
    </div>
  );
}
