
export type SessionStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';

export interface Session {
  id: number;
  auth_user_id: string | null;
  name: string | null;
  description: string | null;
  status: SessionStatus;
  created_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  has_active_round: number | null;
}

export interface SessionWithUsers extends Session {
  users: Array<{ id: number; name: string | null }>;
}
