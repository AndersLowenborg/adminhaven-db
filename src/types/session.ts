
export interface Session {
  id: number;
  created_at: string;
  created_by: string | null;
  name: string | null;
  status: string | null;
  test_mode: boolean | null;
  test_participants_count: number | null;
}
