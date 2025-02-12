
export type StatementStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Statement {
  id: number;
  session_id: number;
  statement: string | null;
  description: string | null;
  status: StatementStatus | null;
  created_at: string | null;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: 'running' | 'stopped';
  show_results?: boolean;
}
