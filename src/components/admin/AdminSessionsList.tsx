import { useQuery } from '@tanstack/react-query';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { SessionsTable } from '@/components/admin/SessionsTable';
import { useToast } from '@/hooks/use-toast';

export const AdminSessionsList = () => {
  const user = useUser();
  const { toast } = useToast();

  const { data: sessionsWithUsers, isLoading, error } = useQuery({
    queryKey: ['admin-sessions', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, cannot fetch sessions');
        throw new Error('No user');
      }

      console.log('Starting to fetch sessions for user:', user.id);
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('Sessions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching user sessions:', sessionsError);
        throw sessionsError;
      }
      console.log('Retrieved sessions for user:', sessions);

      if (!sessions) {
        console.log('No sessions found for user');
        return [];
      }

      const sessionsWithUsers = await Promise.all(
        sessions.map(async (session) => {
          console.log('Fetching users for session:', session.id);
          
          const { data: users, error: usersError } = await supabase
            .from('SessionUsers')
            .select('*')
            .eq('session_id', session.id);

          if (usersError) {
            console.error('Error fetching users for session:', session.id, usersError);
            throw usersError;
          }
          console.log('Retrieved users for session', session.id, ':', users);

          return {
            ...session,
            users: users || [],
          };
        })
      );

      console.log('Final sessions with users:', sessionsWithUsers);
      return sessionsWithUsers;
    },
    enabled: !!user,
    retry: 1,
  });

  if (error) {
    console.error('Error loading sessions:', error);
    toast({
      title: "Error",
      description: "Failed to load sessions. Please try refreshing the page.",
      variant: "destructive",
    });
  }

  return isLoading ? (
    <div className="text-center py-8">Loading sessions...</div>
  ) : (
    <SessionsTable sessions={sessionsWithUsers || []} />
  );
};