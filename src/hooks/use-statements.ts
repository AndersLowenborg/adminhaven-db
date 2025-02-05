
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
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('Statements')
        .insert([
          {
            content,
            session_id: sessionId,
            status: 'pending'
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
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const { data, error } = await supabase
        .from('Statements')
        .update({ content })
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

  const toggleLockMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: number; currentStatus: string }) => {
      const newStatus = currentStatus === 'locked' ? 'pending' : 'locked';
      const { data, error } = await supabase
        .from('Statements')
        .update({ status: newStatus })
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
        description: "Statement status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error toggling statement lock:', error);
      toast({
        title: "Error",
        description: "Failed to update statement status",
        variant: "destructive",
      });
    },
  });

  const moveToNextMutation = useMutation({
    mutationFn: async (currentId: number) => {
      // First, unlock the current statement
      const { error: unlockError } = await supabase
        .from('Statements')
        .update({ status: 'completed' })
        .eq('id', currentId);

      if (unlockError) throw unlockError;

      // Get all statements to find the next one
      const { data: allStatements, error: fetchError } = await supabase
        .from('Statements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Find the index of the current statement and get the next one
      const currentIndex = allStatements.findIndex(s => s.id === currentId);
      const nextStatement = allStatements[currentIndex + 1];

      if (nextStatement) {
        // Lock the next statement
        const { error: lockError } = await supabase
          .from('Statements')
          .update({ status: 'locked' })
          .eq('id', nextStatement.id);

        if (lockError) throw lockError;
      }

      return nextStatement;
    },
    onSuccess: (nextStatement) => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: nextStatement 
          ? "Moved to next statement successfully" 
          : "No more statements available",
      });
    },
    onError: (error) => {
      console.error('Error moving to next statement:', error);
      toast({
        title: "Error",
        description: "Failed to move to next statement",
        variant: "destructive",
      });
    },
  });

  const deleteStatementMutation = useMutation({
    mutationFn: async (statementId: number) => {
      // With CASCADE deletion, we can directly delete the statement
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

  return {
    statements,
    isLoadingStatements,
    addStatement: addStatementMutation.mutate,
    updateStatement: updateStatementMutation.mutate,
    toggleLock: toggleLockMutation.mutate,
    moveToNext: moveToNextMutation.mutate,
    deleteStatement: deleteStatementMutation.mutate,
    isAddingStatement: addStatementMutation.isPending,
    isDeletingStatement: deleteStatementMutation.isPending,
  };
};
