
export interface Answer {
  id: number;
  session_id: number;
  statement_id: number;
  user_id: number;
  agreement_level: number;
  confidence_level: number;
  created_at: string;
  status: string;
}
