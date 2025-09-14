'use client';

import { IEvent } from './types';

export interface AppState {
  currentView: string;
  selectedEventId: string | null;
}

const STORAGE_KEY = 'certi-app-state';

export const saveAppState = (state: AppState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save app state to localStorage:', error);
  }
};

export const loadAppState = (): AppState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);

    // Validate the structure
    if (
      typeof parsed === 'object' &&
      typeof parsed.currentView === 'string' &&
      (parsed.selectedEventId === null ||
        typeof parsed.selectedEventId === 'string')
    ) {
      return parsed;
    }

    return null;
  } catch (error) {
    console.warn('Failed to load app state from localStorage:', error);
    return null;
  }
};

export const clearAppState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear app state from localStorage:', error);
  }
};

export const findEventById = (
  events: IEvent[],
  eventId: string
): IEvent | null => {
  return events.find((event) => event._id?.toString() === eventId) || null;
};
