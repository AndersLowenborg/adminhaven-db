
export interface Answer {
  id: number;
  content: string;
  agreement_level: number | null;
  confidence_level: number | null;
  uncertainty_level: number | null;
  uncertainty_comment: string | null;
  owner_type: 'user' | 'group';
  owner_id: number;
  statement_id: number | null;
  round_id: number | null;
  status: string;
  created_at: string;
}
