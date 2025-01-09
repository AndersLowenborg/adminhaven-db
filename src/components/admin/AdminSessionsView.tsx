import { useUser } from '@supabase/auth-helpers-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SessionsTable } from './SessionsTable';
import { CreateSessionButton } from './CreateSessionButton';

export const AdminSessionsView = () => {
  const user = useUser();
  const { toast } = useToast();

  const { data: sessionsWithUsers, isLoading, error } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      if (!user) {
        console.log('No user found, cannot fetch sessions');
        throw new Error('No user');
      }

      console.log('Starting to fetch sessions for user:', user.id);
      
      // First, let's do a raw query to see ALL sessions (debugging only)
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('Sessions')
        .select('*');
      
      console.log('All sessions in database:', allSessions);
      console.log('Error fetching all sessions:', allSessionsError);

      // Now let's try to get sessions for this specific user
      const { data: sessions, error: sessionsError } = await supabase
        .from('Sessions')
        .select('*')
        .eq('created_by', user.id);

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
    return <div>Error loading sessions. Please try refreshing the page.</div>;
  }

  if (isLoading) {
    return <div>Loading sessions...</div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-8">
        <CreateSessionButton />
      </div>
      <SessionsTable sessions={sessionsWithUsers || []} />
    </div>
  );
};