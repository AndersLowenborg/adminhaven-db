import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useCreateSession = () => {
  const user = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSession = async () => {
    try {
      // Check if user exists and get their ID
      const currentUser = user;
      if (!currentUser?.id) {
        console.log('No authenticated user found');
        toast({
          title: "Authentication Error",
          description: "Please sign in to create a session",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating new session for user:', currentUser.id);
      
      const { data: newSession, error: createError } = await supabase
        .from('Sessions')
        .insert([
          {
            name: 'New Session',
            status: 'unpublished',
            created_by: currentUser.id,
          },
        ])
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
        // Invalidate the sessions query to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['admin-sessions', currentUser.id] });
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