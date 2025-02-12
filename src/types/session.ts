
export type SessionStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Session {
  id: number;
  auth_user_id: string | null;
  name: string | null;
  description: string | null;
  status: SessionStatus;
  allow_joins: boolean;
  current_round: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
}
