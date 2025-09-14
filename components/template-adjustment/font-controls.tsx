'use client';

import { useState } from 'react';
import { ITextConfig, FONT_FAMILIES } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FontControlsProps {
  selectedTextType: 'name' | 'id';
  onTextTypeChange: (type: 'name' | 'id') => void;
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  onConfigChange: (config: ITextConfig) => void;
}

export function FontControls({
  selectedTextType,
  onTextTypeChange,
  nameConfig,
  idConfig,
  onConfigChange,
}: FontControlsProps) {
  const currentConfig = selectedTextType === 'name' ? nameConfig : idConfig;

  const handleConfigChange = (updates: Partial<ITextConfig>) => {
    const newConfig = { ...currentConfig, ...updates };
    onConfigChange(newConfig);
  };

  const handleFontFamilyChange = (fontFamily: string) => {
    handleConfigChange({ fontFamily });
  };

  const handleTextAlignChange = (textAlign: 'left' | 'center' | 'right') => {
    handleConfigChange({ textAlign });
  };

  const handleFontSizeChange = (fontSize: number[]) => {
    handleConfigChange({ fontSize: fontSize[0] });
  };

  const handleColorChange = (color: string) => {
    handleConfigChange({ color });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Font Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Text Type Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Element</Label>
          <RadioGroup
            value={selectedTextType}
            onValueChange={(value) => onTextTypeChange(value as 'name' | 'id')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="name" id="name" />
              <Label htmlFor="name" className="text-sm">
                Name
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="id" id="id" />
              <Label htmlFor="id" className="text-sm">
                Certificate ID
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Font Family */}
        <div className="space-y-2">
          <Label htmlFor="font-family" className="text-sm font-medium">
            Font Family
          </Label>
          <Select
            value={currentConfig.fontFamily}
            onValueChange={handleFontFamilyChange}
          >
            <SelectTrigger id="font-family">
              <SelectValue placeholder="Select font family" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem key={font} value={font}>
                  <span style={{ fontFamily: font }}>{font}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label htmlFor="text-align" className="text-sm font-medium">
            Text Alignment
          </Label>
          <Select
            value={currentConfig.textAlign}
            onValueChange={(value) =>
              handleTextAlignChange(value as 'left' | 'center' | 'right')
            }
          >
            <SelectTrigger id="text-align">
              <SelectValue placeholder="Select alignment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="center">Center</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color Picker */}
        <div className="space-y-2">
          <Label htmlFor="color" className="text-sm font-medium">
            Color
          </Label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              id="color"
              value={currentConfig.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
            />
            <input
              type="text"
              value={currentConfig.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-mono"
              placeholder="#000000"
            />
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="font-size" className="text-sm font-medium">
              Font Size
            </Label>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {currentConfig.fontSize}px
            </span>
          </div>
          <Slider
            id="font-size"
            min={8}
            max={72}
            step={1}
            value={[currentConfig.fontSize]}
            onValueChange={handleFontSizeChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>8px</span>
            <span>72px</span>
          </div>
        </div>

        {/* Position Indicators */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Position</Label>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">X:</span>
                <span className="ml-2 font-mono">
                  {Math.round(currentConfig.x)}px
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Y:</span>
                <span className="ml-2 font-mono">
                  {Math.round(currentConfig.y)}px
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
