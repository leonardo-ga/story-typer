export type Theme = 'coast' | 'orbit' | 'bakery' | 'workshop' | 'city';
export type Language = 'en' | 'it' | 'fr' | 'ko';

export interface Story {
  id: string;
  storyId: string;
  language: Language;
  title: string;
  genre: string;
  estimatedMinutes: number;
  description: string;
  caption: string;
  setting: string;
  effect: string | null;
  theme: Theme;
  ending: string;
  epilogue: string;
  paragraphs: { title: string; time: string; text: string }[];
}
