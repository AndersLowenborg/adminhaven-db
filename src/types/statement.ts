
export interface Statement {
  id: number;
  session_id: number | null;
  statement: string | null;
  description: string | null;
}
