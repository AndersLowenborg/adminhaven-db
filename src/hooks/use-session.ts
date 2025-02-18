
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { Session, SessionStatus } from '@/types/session';

export const useSession = (sessionId: number) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      console.log('Fetching session details for ID:', sessionId);
      const { data, error } = await supabase
        .from('SESSION')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }
      console.log('Session details:', data);
      return data as Session;
    },
    enabled: !!sessionId,
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (newName: string) => {
      const { data, error } = await supabase
        .from('SESSION')
        .update({ name: newName } as Partial<Session>)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as Session;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      toast({
        title: "Success",
        description: "Session name updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session name",
        variant: "destructive",
      });
    },
  });

  return {
    session,
    isLoadingSession,
    updateSession: updateSessionMutation.mutate,
  };
};
