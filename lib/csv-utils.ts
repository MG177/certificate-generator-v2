import { IRecipientData } from './types';

export function parseCSV(csvContent: string): IRecipientData[] {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error(
      'CSV file must contain at least a header row and one data row'
    );
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  // Validate headers
  if (!headers.includes('name') || !headers.includes('certification_id')) {
    throw new Error(
      'CSV file must contain "name" and "certification_id" columns'
    );
  }

  const nameIndex = headers.indexOf('name');
  const certIdIndex = headers.indexOf('certification_id');

  const recipients: IRecipientData[] = [];
  const seenCertIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());

    if (values.length < Math.max(nameIndex + 1, certIdIndex + 1)) {
      console.warn(`Skipping row ${i + 1}: insufficient columns`);
      continue;
    }

    const name = values[nameIndex];
    const certification_id = values[certIdIndex];

    console.log(name, certification_id);

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
    recipients.push({ name, certification_id });
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
