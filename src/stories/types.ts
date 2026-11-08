export type Theme = 'coast' | 'orbit' | 'bakery' | 'workshop';

export interface Story {
  id: string;
  title: string;
  genre: string;
  duration: string;
  description: string;
  caption: string;
  setting: string;
  effect: string | null;
  theme: Theme;
  ending: string;
  epilogue: string;
  paragraphs: { title: string; time: string; text: string }[];
}
