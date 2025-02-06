import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

export const useStatements = (sessionId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Statements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const addStatementMutation = useMutation({
    mutationFn: async ({ content, background }: { content: string; background?: string }) => {
      const { data, error } = await supabase
        .from('Statements')
        .insert([
          {
            content,
            background,
            session_id: sessionId,
            status: 'inactive'
          }
        ])
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
    mutationFn: async ({ id, content, background }: { id: number; content: string; background?: string }) => {
      const { data, error } = await supabase
        .from('Statements')
        .update({ content, background })
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
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const { data, error } = await supabase
        .from('Statements')
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
        description: `Statement ${data.status === 'active' ? 'activated' : 'deactivated'} successfully`,
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

  const deleteStatementMutation = useMutation({
    mutationFn: async (statementId: number) => {
      const { error } = await supabase
        .from('Statements')
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
        .from('Statements')
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
        .from('Statements')
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
    deleteStatement: deleteStatementMutation.mutate,
    startTimer: startTimerMutation.mutate,
    stopTimer: stopTimerMutation.mutate,
    isAddingStatement: addStatementMutation.isPending,
    isDeletingStatement: deleteStatementMutation.isPending,
  };
};
