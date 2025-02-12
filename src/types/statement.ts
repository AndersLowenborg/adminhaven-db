
export type StatementStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Statement {
  id: number;
  session_id: number;
  content: string;
  description?: string;
  status: StatementStatus;
  show_results: boolean;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: string;
  created_at: string;
}
