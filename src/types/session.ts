
export interface Session {
  id: number;
  created_at: string;
  created_by: string | null;
  name: string | null;
  status: 'unpublished' | 'published' | 'round_in_progress' | 'round_ended' | 'completed';
  test_mode: boolean | null;
  test_participants_count: number | null;
  allow_joins: boolean | null;
  current_round: number | null;
}
