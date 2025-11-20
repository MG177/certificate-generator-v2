import { IRecipientData } from './types';

/**
 * Parses a CSV line handling quoted fields properly
 * Supports fields with commas inside quotes and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = i + 1 < line.length ? line[i + 1] : null;

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted field (double quote)
        current += '"';
        i += 2;
      } else if (inQuotes && (nextChar === ',' || nextChar === null || nextChar === '\r')) {
        // End of quoted field (followed by comma, end of line, or carriage return)
        inQuotes = false;
        if (nextChar === ',') {
          // Save current field and start new one
          values.push(current);
          current = '';
          i += 2; // Skip quote and comma
        } else {
          // End of line, just skip the quote
          i++;
        }
      } else if (!inQuotes) {
        // Start of quoted field
        inQuotes = true;
        i++;
      } else {
        // Standalone quote at end (shouldn't happen in well-formed CSV, but handle it)
        inQuotes = false;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator (only when not inside quotes)
      values.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  values.push(current);

  // Trim all values
  return values.map(v => v.trim());
}

export function parseCSV(csvContent: string): IRecipientData[] {
  // Normalize line endings (handle both \r\n and \n)
  const normalized = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.trim().split('\n');

  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());

  // Validate headers
  if (
    !headers.includes('name') ||
    !headers.includes('certification_id') ||
    !headers.includes('email')
  ) {
    throw new Error(
      'CSV file must contain "name", "certification_id" and "email" columns'
    );
  }

  const nameIndex = headers.indexOf('name');
  const certIdIndex = headers.indexOf('certification_id');
  const emailIndex = headers.indexOf('email');

  const recipients: IRecipientData[] = [];
  const seenCertIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }

    const values = parseCSVLine(line);

    if (values.length < Math.max(nameIndex + 1, certIdIndex + 1, emailIndex + 1)) {
      console.warn(`Skipping row ${i + 1}: insufficient columns`);
      continue;
    }

    // Values are already cleaned by parseCSVLine
    const name = values[nameIndex]?.trim();
    const certification_id = values[certIdIndex]?.trim();
    const email = values[emailIndex]?.trim();

    if (!name || !certification_id) {
      console.warn(`Skipping row ${i + 1}: missing required data`);
      continue;
    }

    if (seenCertIds.has(certification_id)) {
      throw new Error(
        `Duplicate certification_id found: "${certification_id}" in row ${
          i + 1
        }`
      );
    }

    seenCertIds.add(certification_id);
    recipients.push({ name, certification_id, email });
  }

  if (recipients.length === 0) {
    throw new Error('No valid recipient data found in CSV file');
  }

  return recipients;
}

export function validateCSVFormat(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        parseCSV(content);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}

/**
 * Downloads a CSV file to the user's device
 * @param csvContent - The CSV content as a string
 * @param filename - The name of the CSV file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  try {
    // Create blob from CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

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
    console.error('Error downloading CSV:', error);
    throw new Error('Failed to download CSV');
  }
}

/**
 * Generates a filename for a CSV export
 * @param eventTitle - The event title
 * @param participantCount - Number of participants
 * @returns A sanitized filename
 */
export function generateCSVFilename(
  eventTitle: string,
  participantCount: number
): string {
  // Sanitize event title for filename
  const sanitizedTitle = eventTitle
    .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase();

  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `participants_${sanitizedTitle}_${participantCount}_${timestamp}.csv`;
}
