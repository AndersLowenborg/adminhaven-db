
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSessionSubscriptions = (sessionId: number) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscriptions for session:', sessionId);
    
    const sessionChannel = supabase
      .channel(`session-updates-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SESSION',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .subscribe();

    const statementsChannel = supabase
      .channel(`statements-updates-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'STATEMENT',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Statements update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
        }
      )
      .subscribe();

    const answersChannel = supabase
      .channel(`session-answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ANSWER',
          filter: `statement.session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Answers update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['answers', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(statementsChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [sessionId, queryClient]);
};
