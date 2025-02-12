
export interface Session {
  id: number;
  created_at: string;
  created_by: string | null;
  name: string | null;
  description: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  allow_joins: boolean | null;
}
