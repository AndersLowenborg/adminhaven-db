
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { Participant } from '@/types/participant';

export const useParticipants = (sessionId: number) => {
  const queryClient = useQueryClient();

  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['participants', sessionId],
    queryFn: async () => {
      console.log('Fetching participants for session:', sessionId);
      const { data, error } = await supabase
        .from('SESSION_USERS')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Participants data:', data);
      return data as Participant[];
    },
    enabled: !!sessionId,
  });

  // Set up realtime subscription for participants
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up realtime subscription for session users:', sessionId);
    const channel = supabase
      .channel(`session-users-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SESSION_USERS',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Session users change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['participants', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up session users subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  return {
    participants,
    isLoadingParticipants,
  };
};
