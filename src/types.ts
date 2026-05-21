export interface Project {
  id: string;
  name: string;
  language: 'en' | 'es' | 'fr' | 'de';
  lastModified: number;
}

export interface FileSystemItem {
  id: string;
  parentId: string | null;
  name: string;
  type: 'part' | 'chapter';
  content?: string;
  order: number;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  relatedFileIds: string[];
}

export interface FileVersion {
  id: string;
  fileId: string;
  content: string;
  timestamp: number;
}

export interface BookState {
  files: FileSystemItem[];
  activeFileId: string | null;
  theme: 'light' | 'dark';
}

export type ColorOption = 'red' | 'orange' | 'yellow' | 'green' | 'light_blue' | 'dark_blue' | 'purple' | 'magenta' | 'pink' | 'grey' | 'black';

export const COLOR_MAP: Record<ColorOption, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  light_blue: '#0ea5e9',
  dark_blue: '#1e40af',
  purple: '#a855f7',
  magenta: '#d946ef',
  pink: '#ec4899',
  grey: '#71717a',
  black: '#09090b',
};
