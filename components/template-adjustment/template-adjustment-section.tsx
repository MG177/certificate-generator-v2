'use client';

import { useState, useEffect } from 'react';
import { CertificatePreview } from './certificate-preview';
import { FontControls } from './font-controls';
import { ITextConfig, IEvent } from '@/lib/types';
import { updateLayoutConfig } from '@/lib/actions';

interface TemplateAdjustmentSectionProps {
  event: IEvent | null;
  onContinue: () => void;
  onBack?: () => void;
}

export function TemplateAdjustmentSection({
  event,
  onContinue,
  onBack,
}: TemplateAdjustmentSectionProps) {
  const [selectedTextType, setSelectedTextType] = useState<'name' | 'id'>(
    'name'
  );
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
          Please select an event from the sidebar to customize the template.
        </p>
      </div>
    );
  }

  if (!templateUrl) {
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          No Template Uploaded
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please upload a template first to customize the layout.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Template Adjustment
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Customize font styles and position text elements on your certificate
          </p>
        </div>
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            Saving...
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Certificate Preview */}
        <div className="space-y-4">
          <CertificatePreview
            templateUrl={templateUrl}
            nameConfig={nameConfig}
            idConfig={idConfig}
            onPositionChange={handlePositionChange}
            selectedTextType={selectedTextType}
            onTextTypeChange={setSelectedTextType}
          />
        </div>

        {/* Font Controls */}
        <div className="space-y-4">
          <FontControls
            selectedTextType={selectedTextType}
            onTextTypeChange={setSelectedTextType}
            nameConfig={nameConfig}
            idConfig={idConfig}
            onConfigChange={
              selectedTextType === 'name'
                ? handleNameConfigChange
                : handleIdConfigChange
            }
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        {onBack && (
          <button
            onClick={onBack}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            ← Back to Template Upload
          </button>
        )}
        <button
          onClick={onContinue}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue to Participants →
        </button>
      </div>
    </div>
  );
}
