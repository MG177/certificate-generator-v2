'use client';

import { useRef, useEffect, useState } from 'react';
import { ITextConfig } from '@/lib/types';

interface CertificatePreviewProps {
  templateUrl: string;
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  onPositionChange: (
    type: 'name' | 'id',
    position: Partial<ITextConfig>
  ) => void;
  selectedTextType: 'name' | 'id';
  onTextTypeChange: (type: 'name' | 'id') => void;
}

export function CertificatePreview({
  templateUrl,
  nameConfig,
  idConfig,
  onPositionChange,
  selectedTextType,
  onTextTypeChange,
}: CertificatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState<'name' | 'id' | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImage(img);
      // Calculate scale to fit container
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };
    img.src = templateUrl;
  }, [templateUrl]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw template image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw text previews
    drawTextPreview(ctx, 'John Doe', nameConfig, scale);
    drawTextPreview(ctx, 'CERT-2025-001', idConfig, scale);

    // Draw position indicators
    drawPositionIndicator(
      ctx,
      nameConfig,
      scale,
      'name',
      selectedTextType === 'name'
    );
    drawPositionIndicator(
      ctx,
      idConfig,
      scale,
      'id',
      selectedTextType === 'id'
    );
  }, [image, scale, nameConfig, idConfig, selectedTextType]);

  const drawTextPreview = (
    ctx: CanvasRenderingContext2D,
    text: string,
    config: ITextConfig,
    scale: number
  ) => {
    ctx.font = `${config.fontSize * scale}px ${config.fontFamily}`;
    ctx.fillStyle = config.color;
    ctx.textAlign = config.textAlign;
    ctx.textBaseline = 'middle';

    // Add subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2 * scale;
    ctx.shadowOffsetX = 1 * scale;
    ctx.shadowOffsetY = 1 * scale;

    ctx.fillText(text, config.x * scale, config.y * scale);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  const drawPositionIndicator = (
    ctx: CanvasRenderingContext2D,
    config: ITextConfig,
    scale: number,
    type: 'name' | 'id',
    isSelected: boolean
  ) => {
    const x = config.x * scale;
    const y = config.y * scale;
    const size = isSelected ? 12 : 8;
    const color = type === 'name' ? '#3b82f6' : '#10b981';

    // Draw crosshair
    ctx.strokeStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    // Draw center dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 4 : 3, 0, 2 * Math.PI);
    ctx.fill();

    // Draw selection ring if selected
    if (isSelected) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(x, y, size + 8, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Check if clicking near name position
    const nameDistance = Math.sqrt(
      Math.pow(x - nameConfig.x, 2) + Math.pow(y - nameConfig.y, 2)
    );
    const idDistance = Math.sqrt(
      Math.pow(x - idConfig.x, 2) + Math.pow(y - idConfig.y, 2)
    );

    if (nameDistance < 30) {
      setDragging('name');
      setDragOffset({ x: x - nameConfig.x, y: y - nameConfig.y });
      onTextTypeChange('name');
    } else if (idDistance < 30) {
      setDragging('id');
      setDragOffset({ x: x - idConfig.x, y: y - idConfig.y });
      onTextTypeChange('id');
    } else {
      // Click to place new position for selected text type
      onPositionChange(selectedTextType, { x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale - dragOffset.x;
    const y = (e.clientY - rect.top) / scale - dragOffset.y;

    onPositionChange(dragging, { x, y });
  };

  const handleMouseUp = () => {
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Template Adjustment
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Click to position • Drag to adjust
        </div>
      </div>

      <div
        ref={containerRef}
        className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800"
        style={{ minHeight: '400px' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="cursor-pointer max-w-full max-h-full block mx-auto"
          style={{ display: 'block' }}
        />
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Name</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Certificate ID</span>
        </div>
      </div>
    </div>
  );
}
