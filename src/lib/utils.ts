import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract and parse JSON from a string that may contain conversational filler or markdown.
 * This is critical for handling LLM outputs that aren't strictly JSON.
 */
export function extractJson<T>(text: string): T | null {
  try {
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1) return null;

    const jsonString = text.slice(startIdx, endIdx + 1);
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.error('[extractJson] Failed to parse JSON:', e);
    return null;
  }
}
