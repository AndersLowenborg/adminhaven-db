
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from '@tanstack/react-query';

export const useStatementVisibility = (sessionId: number) => {
  const [visibleResults, setVisibleResults] = useState<number[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    // Set up real-time subscription for visibility updates
    const channel = supabase.channel(`visibility_${sessionId}`)
      .on('broadcast', { event: 'visibility_update' }, ({ payload }) => {
        console.log('Received visibility update:', payload);
        setVisibleResults(payload.visibleStatements);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const toggleVisibility = async (statementId: number) => {
    const newVisibleResults = visibleResults.includes(statementId)
      ? visibleResults.filter(id => id !== statementId)
      : [...visibleResults, statementId];

    setVisibleResults(newVisibleResults);
    
    // Broadcast the update to all connected clients
    const channel = supabase.channel(`visibility_${sessionId}`);
    await channel.send({
      type: 'broadcast',
      event: 'visibility_update',
      payload: { visibleStatements: newVisibleResults }
    });
  };

  return {
    visibleResults,
    toggleVisibility
  };
};
