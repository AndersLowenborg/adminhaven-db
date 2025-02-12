
export interface Answer {
  id: number;
  statement_id: number;
  respondant_id: number;
  respondant_type: 'SESSION_USER' | 'GROUP';
  agreement_level: number;
  confidence_level: number;
  comment?: string;
  created_at: string;
  round_id?: number;
}
