
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Statement } from '@/types/statement';

export const useStatements = (sessionId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as Statement[];
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
          session_id: sessionId
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

  return {
    statements,
    isLoadingStatements,
    addStatement: addStatementMutation.mutate,
    updateStatement: updateStatementMutation.mutate,
    deleteStatement: deleteStatementMutation.mutate,
    isAddingStatement: addStatementMutation.isPending,
    isDeletingStatement: deleteStatementMutation.isPending,
  };
};
