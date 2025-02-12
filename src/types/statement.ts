
export type StatementStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Statement {
  id: number;
  session_id: number;
  statement: string;
  description?: string;
  status?: StatementStatus;
  created_at?: string;
}
