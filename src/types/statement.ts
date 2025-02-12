
export type StatementStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Statement {
  id: number;
  session_id: number | null;
  statement: string | null;
  description: string | null;
}
