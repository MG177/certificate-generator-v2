import {
  createCanvas,
  loadImage,
  Canvas,
  CanvasRenderingContext2D,
} from 'canvas';
import { ITextConfig, IRecipientData } from './types';

export async function generateCertificate(
  templateUrl: string,
  recipient: IRecipientData,
  nameConfig: ITextConfig,
  idConfig: ITextConfig
): Promise<Buffer> {
  try {
    // Load the template image
    const image = await loadImage(templateUrl);

    // Create canvas with template dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw the template
    ctx.drawImage(image, 0, 0);

    // Draw recipient name
    drawText(ctx, recipient.name, nameConfig);

    // Draw certificate ID
    drawText(ctx, recipient.certification_id, idConfig);

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Failed to generate certificate');
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: ITextConfig
) {
  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  ctx.fillStyle = config.color;
  ctx.textAlign = config.textAlign;
  ctx.textBaseline = 'middle';

  // Add text shadow for better visibility
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillText(text, config.x, config.y);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function getTextMetrics(
  text: string,
  config: ITextConfig,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): { width: number; height: number } {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.font = `${config.fontSize}px ${config.fontFamily}`;
  const metrics = ctx.measureText(text);

  return {
    width: metrics.width,
    height: config.fontSize,
  };
}
