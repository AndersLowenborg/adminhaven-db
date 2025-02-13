
export interface Statement {
  id: number;
  session_id: number | null;
  statement: string | null;
  description: string | null;
  status?: 'ACTIVE' | 'INACTIVE';
  show_results?: boolean;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: string;
}
