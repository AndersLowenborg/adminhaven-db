
export interface Session {
  id: number;
  created_at: string;
  created_by: string | null;
  name: string | null;
  description: string | null;
  status: 'NOT_STARTED' | 'PUBLISHED' | 'IN_PROGRESS' | 'ENDED';
  allow_joins: boolean;
  started_at: string | null;
  ended_at: string | null;
}
