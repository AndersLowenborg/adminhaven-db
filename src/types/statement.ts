
export type StatementStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Statement {
  id: number;
  session_id: number;
  statement: string | null;
  description: string | null;
  status: StatementStatus | null;
  created_at: string | null;
}
