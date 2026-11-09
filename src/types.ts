import type { ErrorMode } from './preferences';
export interface Session {
  value: string;
  started: boolean;
  finished: boolean;
  attempts: number;
  correct: number;
  elapsed: number;
  assisted?: number;
  assistance?: boolean;
  errorMode?: ErrorMode;
}
