
export interface SessionUser {
  id: number;
  name: string | null;
  session_id: number | null;
}

export interface AdminSession {
  id: number;
  name: string | null;
  status: 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';
  created_at: string;
  users?: SessionUser[];
}
