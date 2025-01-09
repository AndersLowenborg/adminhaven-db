import { useUser } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const CreateSessionButton = () => {
  const user = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateSession = async () => {
    try {
      if (!user) {
        console.log('No user found, cannot create session');
        toast({
          title: "Error",
          description: "Please log in to create a session",
          variant: "destructive",
        });
        return;
      }

      console.log('Creating new session for user:', user.id);
      
      const { data: session, error } = await supabase
        .from('Sessions')
        .insert([
          {
            name: 'New Session',
            status: 'unpublished',
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }

      console.log('Session created successfully:', session);

      if (session) {
        toast({
          title: "Success",
          description: "Session created successfully",
        });
        navigate(`/admin/session/${session.id}`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleCreateSession}>Create New Session</Button>
  );
};