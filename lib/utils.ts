import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date, style: 'iso' | 'medium' | 'long') {
  if (style === 'iso') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: style === 'long' ? 'long' : 'short',
    day: style === 'long' ? 'numeric' : '2-digit',
    year: 'numeric',
  }).format(date);
}
