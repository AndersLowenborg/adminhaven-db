
export interface Answer {
  id: number;
  statement_id: number;
  respondant_id: number;
  respondant_type: 'SESSION_USER' | 'GROUP';
  agreement_level: number | null;
  confidence_level: number | null;
  comment: string | null;
  created_at: string | null;
  round_id: number | null;
}
