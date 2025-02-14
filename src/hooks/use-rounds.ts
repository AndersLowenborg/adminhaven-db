
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Session } from '@/types/session';

export const useRounds = (sessionId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const startRoundMutation = useMutation({
    mutationFn: async ({ statementId, session }: { statementId: number, session: Session | null }) => {
      console.log('Starting round for statement:', statementId);
      
      if (session?.status === 'PUBLISHED') {
        console.log('Session status is published, updating to started');
        const { error: sessionError } = await supabase
          .from('SESSION')
          .update({ 
            status: 'STARTED'
          })
          .eq('id', sessionId);

        if (sessionError) throw sessionError;
      }

      // Get the last round number for this statement
      const { data: existingRounds, error: roundsError } = await supabase
        .from('ROUND')
        .select('round_number')
        .eq('statement_id', statementId)
        .order('round_number', { ascending: false })
        .limit(1);

      if (roundsError) throw roundsError;

      const nextRoundNumber = existingRounds && existingRounds.length > 0 
        ? existingRounds[0].round_number + 1 
        : 1;

      // Create the new round with required fields
      const { data: newRound, error: roundError } = await supabase
        .from('ROUND')
        .insert({
          id: Date.now(), // Generate a unique ID
          statement_id: statementId,
          round_number: nextRoundNumber,
          status: 'STARTED',
          started_at: new Date().toISOString(),
          respondant_type: 'SESSION_USER' // Set default respondant type
        })
        .select()
        .single();

      if (roundError) throw roundError;

      return { success: true, round: newRound };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-rounds', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Round started successfully",
      });
    },
    onError: (error) => {
      console.error('Error starting round:', error);
      toast({
        title: "Error",
        description: "Failed to start round",
        variant: "destructive",
      });
    },
  });

  const endRoundMutation = useMutation({
    mutationFn: async (statementId: number) => {
      console.log('Ending round for statement:', statementId);
      
      const { error: roundError } = await supabase
        .from('ROUND')
        .update({ 
          status: 'COMPLETED',
          ended_at: new Date().toISOString()
        })
        .eq('statement_id', statementId)
        .eq('status', 'STARTED');

      if (roundError) throw roundError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-rounds', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Round ended successfully",
      });
    },
    onError: (error) => {
      console.error('Error ending round:', error);
      toast({
        title: "Error",
        description: "Failed to end round",
        variant: "destructive",
      });
    },
  });

  return {
    startRound: startRoundMutation.mutate,
    endRound: endRoundMutation.mutate,
    isStartingRound: startRoundMutation.isPending,
    isEndingRound: endRoundMutation.isPending,
  };
};
