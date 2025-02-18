
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

      // First, check if there's a NOT_STARTED round we can use
      const { data: existingRound, error: existingRoundError } = await supabase
        .from('ROUND')
        .select('*')
        .eq('statement_id', statementId)
        .eq('status', 'NOT_STARTED')
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      if (existingRoundError && existingRoundError.code !== 'PGRST116') throw existingRoundError;

      if (existingRound) {
        // Update the existing round to STARTED
        const { data: updatedRound, error: updateError } = await supabase
          .from('ROUND')
          .update({
            status: 'STARTED',
            started_at: new Date().toISOString()
          })
          .eq('id', existingRound.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Update the session with the active round ID
        const { error: updateSessionError } = await supabase
          .from('SESSION')
          .update({ 
            has_active_round: updatedRound.id 
          })
          .eq('id', sessionId);

        if (updateSessionError) throw updateSessionError;

        return { success: true, round: updatedRound };
      }

      // If no NOT_STARTED round exists, create a new one
      const { data: lastRound, error: roundsError } = await supabase
        .from('ROUND')
        .select('round_number')
        .eq('statement_id', statementId)
        .order('round_number', { ascending: false })
        .limit(1);

      if (roundsError) throw roundsError;

      const nextRoundNumber = lastRound && lastRound.length > 0 
        ? lastRound[0].round_number + 1 
        : 1;

      // Create the new round
      const { data: newRound, error: roundError } = await supabase
        .from('ROUND')
        .insert({
          id: Date.now(),
          statement_id: statementId,
          round_number: nextRoundNumber,
          status: 'STARTED',
          started_at: new Date().toISOString(),
          respondant_type: 'SESSION_USER'
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Update the session with the active round ID
      const { error: updateSessionError } = await supabase
        .from('SESSION')
        .update({ 
          has_active_round: newRound.id 
        })
        .eq('id', sessionId);

      if (updateSessionError) throw updateSessionError;

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

  const lockRoundMutation = useMutation({
    mutationFn: async (statementId: number) => {
      console.log('Locking round for statement:', statementId);
      
      // Lock the round
      const { error: roundError } = await supabase
        .from('ROUND')
        .update({ 
          status: 'LOCKED',
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
        description: "Round locked successfully",
      });
    },
    onError: (error) => {
      console.error('Error locking round:', error);
      toast({
        title: "Error",
        description: "Failed to lock round",
        variant: "destructive",
      });
    },
  });

  const nextRoundMutation = useMutation({
    mutationFn: async (statementId: number) => {
      console.log('Moving to next round for statement:', statementId);
      
      // Get the current round number
      const { data: currentRound, error: currentRoundError } = await supabase
        .from('ROUND')
        .select('round_number')
        .eq('statement_id', statementId)
        .eq('status', 'LOCKED')
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      if (currentRoundError) throw currentRoundError;

      const nextRoundNumber = currentRound.round_number + 1;
      if (nextRoundNumber > 4) {
        throw new Error('Maximum round number reached');
      }

      // Start the next round with NOT_STARTED status
      const { data: newRound, error: startError } = await supabase
        .from('ROUND')
        .insert({
          id: Date.now(),
          statement_id: statementId,
          round_number: nextRoundNumber,
          status: 'NOT_STARTED',
          started_at: new Date().toISOString(),
          respondant_type: nextRoundNumber === 1 ? 'SESSION_USER' : 'GROUP'
        })
        .select()
        .single();

      if (startError) throw startError;

      // Update the session with the new active round
      const { error: sessionError } = await supabase
        .from('SESSION')
        .update({ has_active_round: newRound.id })
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      return { success: true, round: newRound };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-rounds', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Next round prepared",
      });
    },
    onError: (error) => {
      console.error('Error moving to next round:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to move to next round",
        variant: "destructive",
      });
    },
  });

  return {
    startRound: startRoundMutation.mutate,
    lockRound: lockRoundMutation.mutate,
    nextRound: nextRoundMutation.mutate,
    isStartingRound: startRoundMutation.isPending,
    isLockingRound: lockRoundMutation.isPending,
    isChangingRound: nextRoundMutation.isPending,
  };
};
