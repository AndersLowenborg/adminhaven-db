
export interface Answer {
  id: number;
  created_at: string;
  content: string | null;
  respondent_type: 'user' | 'group';
  respondent_id: number;
  statement_id: number | null;
  round_id: number | null;
  agreement_level: number | null;
  confidence_level: number | null;
  uncertainty_level: number | null;
  uncertainty_comment: string | null;
  status: 'pending' | 'submitted' | 'final';
}
