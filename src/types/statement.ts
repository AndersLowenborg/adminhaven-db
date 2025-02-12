
export type StatementStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';
export type TimerStatus = 'running' | 'stopped';

export interface Statement {
  id: number;
  session_id: number;
  content: string;
  description?: string;
  status: StatementStatus;
  show_results: boolean;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: TimerStatus;
  created_at: string;
}
