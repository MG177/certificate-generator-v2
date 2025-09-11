'use client';

import { useRef, useEffect, useState } from 'react';
import { ITextConfig } from '@/lib/types';

interface CertificateCanvasProps {
  templateUrl: string;
  nameConfig: ITextConfig;
  idConfig: ITextConfig;
  onPositionChange: (
    type: 'name' | 'id',
    position: { x: number; y: number }
  ) => void;
  className?: string;
}

export function CertificateCanvas({
  templateUrl,
  nameConfig,
  idConfig,
  onPositionChange,
  className = '',
}: CertificateCanvasProps) {
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
    drawPositionIndicator(ctx, nameConfig, scale, 'name');
    drawPositionIndicator(ctx, idConfig, scale, 'id');
  }, [image, scale, nameConfig, idConfig]);

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
    type: 'name' | 'id'
  ) => {
    const x = config.x * scale;
    const y = config.y * scale;
    const size = 8;

    // Draw crosshair
    ctx.strokeStyle = type === 'name' ? '#3b82f6' : '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x + size, y);
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.stroke();

    // Draw center dot
    ctx.fillStyle = type === 'name' ? '#3b82f6' : '#10b981';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
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
    } else if (idDistance < 30) {
      setDragging('id');
      setDragOffset({ x: x - idConfig.x, y: y - idConfig.y });
    } else {
      // Click to place new position
      const closer = nameDistance < idDistance ? 'name' : 'id';
      onPositionChange(closer, { x, y });
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
    <div
      ref={containerRef}
      className={`border rounded-lg overflow-hidden ${className}`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="cursor-pointer max-w-full max-h-full"
        style={{ display: 'block' }}
      />
      <div className="p-2 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        Click to reposition • Drag indicators to fine-tune • Blue: Name • Green:
        Certificate ID
      </div>
    </div>
  );
}
