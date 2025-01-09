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
        console.error('No user found in AdminSessionsView');
        return [];
      }

      console.log('AdminSessionsView: Fetching sessions for user:', user.id);
      
      try {
        // First fetch all sessions for debugging
        const { data: allSessions, error: allSessionsError } = await supabase
          .from('Sessions')
          .select('*');
        
        if (allSessionsError) {
          console.error('Error fetching all sessions:', allSessionsError);
          throw allSessionsError;
        }
        
        console.log('All sessions in database:', allSessions);

        // Now fetch sessions for this specific user
        const { data: sessions, error: sessionsError } = await supabase
          .from('Sessions')
          .select('*')
          .eq('created_by', user.id);

        if (sessionsError) {
          console.error('Error fetching user sessions:', sessionsError);
          throw sessionsError;
        }

        console.log('User sessions:', sessions);

        if (!sessions) {
          console.log('No sessions found for user');
          return [];
        }

        // Fetch users for each session
        const sessionsWithUsers = await Promise.all(
          sessions.map(async (session) => {
            try {
              const { data: users, error: usersError } = await supabase
                .from('SessionUsers')
                .select('*')
                .eq('session_id', session.id);

              if (usersError) {
                console.error('Error fetching users for session:', session.id, usersError);
                throw usersError;
              }

              console.log('Users for session', session.id, ':', users);

              return {
                ...session,
                users: users || [],
              };
            } catch (error) {
              console.error('Error processing session:', session.id, error);
              return {
                ...session,
                users: [],
              };
            }
          })
        );

        console.log('Final sessions with users:', sessionsWithUsers);
        return sessionsWithUsers;
      } catch (error) {
        console.error('Error in sessions query:', error);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
  });

  if (error) {
    console.error('Error in AdminSessionsView:', error);
    toast({
      title: "Error Loading Sessions",
      description: "There was a problem loading your sessions. Please try again.",
      variant: "destructive",
    });
    return (
      <div className="p-4 text-red-500">
        Error loading sessions. Please refresh the page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-gray-500">
        Loading your sessions...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-amber-500">
        Please log in to view your sessions.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Sessions</h2>
        <CreateSessionButton />
      </div>
      {sessionsWithUsers && sessionsWithUsers.length > 0 ? (
        <SessionsTable sessions={sessionsWithUsers} />
      ) : (
        <div className="text-center p-8 text-gray-500">
          No sessions found. Create one to get started!
        </div>
      )}
    </div>
  );
};