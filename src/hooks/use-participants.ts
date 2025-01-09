import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useParticipants = (sessionId: number) => {
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['participants', sessionId],
    queryFn: async () => {
      console.log('Fetching participants for session:', sessionId);
      const { data, error } = await supabase
        .from('SessionUsers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Participants data:', data);
      return data || [];
    },
    enabled: !!sessionId,
  });

  return {
    participants,
    isLoadingParticipants,
  };
};