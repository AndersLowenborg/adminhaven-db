
export interface Session {
  id: number;
  created_at: string;
  created_by: string | null;
  name: string | null;
  status: 'draft' | 'unpublished' | 'published' | 'started' | 'completed';
  test_mode: boolean | null;
  test_participants_count: number | null;
  allow_joins: boolean | null;
  current_round: number | null;
}
