'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ColorPicker } from '@/components/ui/color-picker';
import { ITextConfig, FONT_FAMILIES } from '@/lib/types';

interface FontCustomizerProps {
  label: string;
  config: ITextConfig;
  onChange: (config: ITextConfig) => void;
}

export function FontCustomizer({
  label,
  config,
  onChange,
}: FontCustomizerProps) {
  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="font-medium text-lg">{label}</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Font Family</Label>
          <Select
            value={config.fontFamily}
            onValueChange={(value) =>
              onChange({ ...config, fontFamily: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((font) => (
                <SelectItem
                  key={font}
                  value={font}
                  style={{ fontFamily: font }}
                >
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Font Size: {config.fontSize}px</Label>
          <Slider
            value={[config.fontSize]}
            onValueChange={(value) =>
              onChange({ ...config, fontSize: value[0] })
            }
            min={12}
            max={120}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Text Alignment</Label>
        <Select
          value={config.textAlign}
          onValueChange={(value: 'left' | 'center' | 'right') =>
            onChange({ ...config, textAlign: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex items-center space-x-2">
          <ColorPicker
            value={config.color}
            onChange={(color) => onChange({ ...config, color })}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {config.color}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
        <div>Position X: {Math.round(config.x)}px</div>
        <div>Position Y: {Math.round(config.y)}px</div>
      </div>
    </div>
  );
}
