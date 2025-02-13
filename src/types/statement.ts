
export interface Statement {
  id: number;
  session_id: number | null;
  statement: string | null;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | null;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: string;
}
