
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

// Round interface
export interface Round {
  id: number;
  statement_id: number | null;
  status: RoundStatus;
  round_number: number | null;
  started_at: string | null;
  ended_at: string | null;
  respondant_type: RespondantType | null;
}

// Group interface
export interface Group {
  id: number;
  leader: number | null;
  members?: SessionUser[];
}

// Round-Group relationship interface
export interface RoundGroup {
  id: number;
  round_id: number | null;
  group_id: number | null;
}
