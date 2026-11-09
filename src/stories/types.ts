import type { Theme } from './themes';
export type { Theme } from './themes';
import type { Language } from '../languages';
export type { Language } from '../languages';

export interface Story {
  id: string;
  storyId: string;
  language: Language;
  title: string;
  genre: string;
  estimatedMinutes: number;
  estimateWpm?: number;
  description: string;
  caption: string;
  setting: string;
  theme: Theme;
  ending: string;
  epilogue: string;
  paragraphs: { title: string; time: string; text: string }[];
}
