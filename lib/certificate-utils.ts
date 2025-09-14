/**
 * Utility functions for certificate download and file handling
 */

/**
 * Downloads a certificate file to the user's device
 * @param buffer - The certificate data as ArrayBuffer
 * @param filename - The name of the file to download
 */
export function downloadCertificate(
  buffer: ArrayBuffer,
  filename: string
): void {
  try {
    // Create blob from buffer
    const blob = new Blob([buffer], { type: 'image/png' });

    // Create download URL
    const url = URL.createObjectURL(blob);

    // Create temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading certificate:', error);
    throw new Error('Failed to download certificate');
  }
}

/**
 * Downloads a ZIP file containing multiple certificates
 * @param buffer - The ZIP data as ArrayBuffer
 * @param filename - The name of the ZIP file to download
 */
export function downloadZipFile(buffer: ArrayBuffer, filename: string): void {
  try {
    // Create blob from buffer
    const blob = new Blob([buffer], { type: 'application/zip' });

    // Create download URL
    const url = URL.createObjectURL(blob);

    // Create temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append to DOM, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading ZIP file:', error);
    throw new Error('Failed to download ZIP file');
  }
}

/**
 * Generates a filename for a certificate
 * @param participantName - The participant's name
 * @param certificationId - The certification ID
 * @returns A sanitized filename
 */
export function generateCertificateFilename(
  participantName: string,
  certificationId: string
): string {
  // Sanitize participant name for filename
  const sanitizedName = participantName
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();

  return `certificate_${sanitizedName}_${certificationId}.png`;
}

/**
 * Generates a filename for a ZIP file containing multiple certificates
 * @param eventTitle - The event title
 * @param participantCount - Number of participants
 * @returns A sanitized filename
 */
export function generateZipFilename(
  eventTitle: string,
  participantCount: number
): string {
  // Sanitize event title for filename
  const sanitizedTitle = eventTitle
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `certificates_${sanitizedTitle}_${participantCount}_${timestamp}.zip`;
}
