
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SessionStatus } from '@/types/session';

export const useCreateSession = () => {
  const { session } = useSessionContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSession = async () => {
    try {
      if (!session?.user?.id) {
        console.log('No authenticated user found');
        toast({
          title: "Authentication Error",
          description: "Please sign in to create a session",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating new session for user:', session.user.id);
      
      const { data: newSession, error: createError } = await supabase
        .from('SESSION')
        .insert({
          name: 'New Session',
          status: 'UNPUBLISHED' as SessionStatus,
          auth_user_id: session.user.id,
          current_round: 0
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating session:', createError);
        toast({
          title: "Error",
          description: "Failed to create session. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Session created successfully:', newSession);

      if (newSession) {
        await queryClient.invalidateQueries({ queryKey: ['admin-sessions', session.user.id] });
        toast({
          title: "Success",
          description: "Session created successfully",
        });
        navigate(`/admin/session/${newSession.id}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    }
  };

  return createSession;
};
