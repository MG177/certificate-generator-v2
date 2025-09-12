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
import { CertificateCanvas } from '@/components/certificate-canvas';
import { FontCustomizer } from '@/components/font-customizer';
import { ITextConfig, IEvent } from '@/lib/types';
import { updateLayoutConfig } from '@/lib/actions';

interface LayoutCustomizationTabProps {
  event: IEvent | null;
  onContinue: () => void;
}

export function LayoutCustomizationTab({
  event,
  onContinue,
}: LayoutCustomizationTabProps) {
  const [nameConfig, setNameConfig] = useState<ITextConfig>({
    x: 0,
    y: 0,
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
  });
  const [idConfig, setIdConfig] = useState<ITextConfig>({
    x: 0,
    y: 0,
    fontFamily: 'Arial',
    fontSize: 18,
    color: '#000000',
    textAlign: 'center',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize configs from event
  useEffect(() => {
    if (event) {
      setNameConfig(event.nameConfig);
      setIdConfig(event.idConfig);
    }
  }, [event]);

  const handlePositionChange = async (
    type: 'name' | 'id',
    position: Partial<ITextConfig>
  ) => {
    if (!event?._id) return;

    const newNameConfig =
      type === 'name' ? { ...nameConfig, ...position } : nameConfig;
    const newIdConfig = type === 'id' ? { ...idConfig, ...position } : idConfig;

    setNameConfig(newNameConfig);
    setIdConfig(newIdConfig);

    // Auto-save layout changes
    setIsSaving(true);
    try {
      await updateLayoutConfig(
        event._id.toString(),
        newNameConfig,
        newIdConfig
      );
    } catch (error) {
      console.error('Error saving layout config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNameConfigChange = async (config: ITextConfig) => {
    setNameConfig(config);

    if (!event?._id) return;

    setIsSaving(true);
    try {
      await updateLayoutConfig(event._id.toString(), config, idConfig);
    } catch (error) {
      console.error('Error saving name config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleIdConfigChange = async (config: ITextConfig) => {
    setIdConfig(config);

    if (!event?._id) return;

    setIsSaving(true);
    try {
      await updateLayoutConfig(event._id.toString(), nameConfig, config);
    } catch (error) {
      console.error('Error saving ID config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const templateUrl = event?.template.base64
    ? `data:image/png;base64,${event.template.base64}`
    : '';

  if (!event) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Layout Customization</CardTitle>
          <CardDescription>
            Please create an event first to customize the layout.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Certificate Preview</CardTitle>
            <CardDescription>
              Click on the template to position text elements. Drag the
              indicators to fine-tune positions.
              {isSaving && (
                <span className="text-blue-600 ml-2">Saving...</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templateUrl ? (
              <CertificateCanvas
                templateUrl={templateUrl}
                nameConfig={nameConfig}
                idConfig={idConfig}
                onPositionChange={handlePositionChange}
                className="w-full h-96"
              />
            ) : (
              <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Please upload a template first</p>
              </div>
            )}
          </CardContent>
        </Card>

        <FontCustomizer
          label="Recipient Name"
          config={nameConfig}
          onChange={handleNameConfigChange}
        />

        <FontCustomizer
          label="Certificate ID"
          config={idConfig}
          onChange={handleIdConfigChange}
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onContinue}
          className="bg-blue-600 hover:bg-blue-700"
          disabled={!templateUrl}
        >
          Continue to Recipients
        </Button>
      </div>
    </div>
  );
}
