export interface Session {
  value: string;
  started: boolean;
  finished: boolean;
  attempts: number;
  correct: number;
  elapsed: number;
}
