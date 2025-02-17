
// Basic user type without circular references
export interface SessionUser {
  id: number;
  name: string | null;
  session_id: number | null;
}

// Status types to avoid magic strings
export type SessionStatus = 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';
export type RoundStatus = 'NOT_STARTED' | 'STARTED' | 'COMPLETED';
export type RespondantType = 'SESSION_USER' | 'GROUP';

// Core session interface
export interface AdminSession {
  id: number;
  name: string | null;
  status: SessionStatus;
  created_at: string;
  users?: SessionUser[];
}
