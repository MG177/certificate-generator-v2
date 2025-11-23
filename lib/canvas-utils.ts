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
    if (recipient.name) {
      drawText(ctx, recipient.name, nameConfig);
    }

    // Draw certificate ID
    if (recipient.certification_id) {
      drawText(ctx, recipient.certification_id, idConfig);
    }

    return canvas.toBuffer('image/png');
  } catch (error) {
    console.error('Error generating certificate:', error);
    console.error('Template URL:', templateUrl?.substring(0, 100)); // Log first 100 chars
    console.error('Recipient:', recipient);
    console.error('Name config:', nameConfig);
    console.error('ID config:', idConfig);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate certificate: ${errorMessage}`);
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: ITextConfig
) {
  // Map fonts to more commonly available alternatives in production
  // The canvas package requires fonts to be installed on the system
  // If a font isn't available, it will fall back to a default (which may look wrong)
  const fontName = getProductionSafeFont(config.fontFamily);
  
  // Canvas font format: "size fontName" (no CSS font stacks supported)
  ctx.font = `${config.fontSize}px ${fontName}`;
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

/**
 * Maps fonts to production-safe alternatives.
 * In production (especially Docker/serverless), fonts may not be installed.
 * This function maps to fonts that are more likely to be available.
 * 
 * Note: For best results, ensure fonts are installed in your production environment.
 * For Docker: Add font installation to your Dockerfile
 * For Vercel/Serverless: Fonts may need to be bundled or system fonts used
 */
function getProductionSafeFont(fontFamily: string): string {
  // Map to fonts that are more commonly available across systems
  // If the requested font isn't available, canvas will fall back to a default
  const fontMap: Record<string, string> = {
    // Keep Arial as-is (usually available)
    'Arial': 'Arial',
    // Map Windows-specific fonts to more universal alternatives
    'Calibri': 'Arial', // Calibri often not available, use Arial
    'Comic Sans MS': 'Arial', // Comic Sans often not available
    'Impact': 'Arial', // Impact often not available
    'Trebuchet MS': 'Arial', // Trebuchet often not available
    // Keep common system fonts
    'Times New Roman': 'Times New Roman',
    'Georgia': 'Georgia',
    'Verdana': 'Verdana',
    'Courier New': 'Courier New',
    'Palatino': 'Palatino',
  };

  // Return mapped font or original (canvas will handle fallback if not available)
  return fontMap[fontFamily] || fontFamily;
}

export function getTextMetrics(
  text: string,
  config: ITextConfig,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): { width: number; height: number } {
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  const fontName = getProductionSafeFont(config.fontFamily);
  ctx.font = `${config.fontSize}px ${fontName}`;
  const metrics = ctx.measureText(text);

  return {
    width: metrics.width,
    height: config.fontSize,
  };
}
