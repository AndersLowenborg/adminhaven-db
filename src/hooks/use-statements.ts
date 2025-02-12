
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Statement, StatementStatus } from '@/types/statement';

export const useStatements = (sessionId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Map the database fields to our Statement interface
      const mappedStatements = data?.map(item => ({
        id: item.id,
        session_id: item.session_id,
        content: item.statement || '',
        description: item.description,
        status: item.status as StatementStatus,
        show_results: false,
        created_at: item.created_at || new Date().toISOString(),
        timer_seconds: item.timer_seconds,
        timer_started_at: item.timer_started_at,
        timer_status: item.timer_status
      })) || [];

      return mappedStatements as Statement[];
    },
    enabled: !!sessionId,
  });

  const addStatementMutation = useMutation({
    mutationFn: async ({ content, description }: { content: string; description?: string }) => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .insert({
          statement: content,
          description,
          session_id: sessionId,
          status: 'UNPUBLISHED' as StatementStatus
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Statement added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding statement:', error);
      toast({
        title: "Error",
        description: "Failed to add statement",
        variant: "destructive",
      });
    },
  });

  const updateStatementMutation = useMutation({
    mutationFn: async ({ id, content, description }: { id: number; content: string; description?: string }) => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .update({ 
          statement: content,
          description 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Statement updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating statement:', error);
      toast({
        title: "Error",
        description: "Failed to update statement",
        variant: "destructive",
      });
    },
  });

  const toggleStatementStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: StatementStatus }) => {
      const newStatus = currentStatus === 'STARTED' ? 'UNPUBLISHED' : 'STARTED';
      const { data, error } = await supabase
        .from('STATEMENT')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: `Statement ${data.status === 'STARTED' ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error) => {
      console.error('Error toggling statement status:', error);
      toast({
        title: "Error",
        description: "Failed to update statement status",
        variant: "destructive",
      });
    },
  });

  const toggleShowResultsMutation = useMutation({
    mutationFn: async ({ id, currentShowResults }: { id: number; currentShowResults: boolean }) => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .update({ show_results: !currentShowResults })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: `Results ${data.show_results ? 'shown' : 'hidden'} successfully`,
      });
    },
    onError: (error) => {
      console.error('Error toggling show results:', error);
      toast({
        title: "Error",
        description: "Failed to toggle results visibility",
        variant: "destructive",
      });
    },
  });

  const deleteStatementMutation = useMutation({
    mutationFn: async (statementId: number) => {
      const { error } = await supabase
        .from('STATEMENT')
        .delete()
        .eq('id', statementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Statement deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting statement:', error);
      toast({
        title: "Error",
        description: "Failed to delete statement",
        variant: "destructive",
      });
    },
  });

  const startTimerMutation = useMutation({
    mutationFn: async ({ id, seconds }: { id: number; seconds: number }) => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .update({ 
          timer_seconds: seconds,
          timer_started_at: new Date().toISOString(),
          timer_status: 'running'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Timer started successfully",
      });
    },
    onError: (error) => {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    },
  });

  const stopTimerMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .update({ 
          timer_status: 'stopped'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Timer stopped successfully",
      });
    },
    onError: (error) => {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    },
  });

  return {
    statements,
    isLoadingStatements,
    addStatement: addStatementMutation.mutate,
    updateStatement: updateStatementMutation.mutate,
    toggleStatementStatus: toggleStatementStatusMutation.mutate,
    toggleShowResults: toggleShowResultsMutation.mutate,
    deleteStatement: deleteStatementMutation.mutate,
    startTimer: startTimerMutation.mutate,
    stopTimer: stopTimerMutation.mutate,
    isAddingStatement: addStatementMutation.isPending,
    isDeletingStatement: deleteStatementMutation.isPending,
  };
};
