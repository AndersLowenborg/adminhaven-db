import { useQuery } from '@tanstack/react-query';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { SessionsTable } from '@/components/admin/SessionsTable';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export const AdminSessionsList = () => {
  const { session } = useSessionContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessionsWithUsers, isLoading, error } = useQuery({
    queryKey: ['admin-sessions', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) {
        console.log('No user found in session, cannot fetch sessions');
        return [];
      }

      console.log('Starting to fetch sessions for user:', session.user.id);
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('Sessions')
        .select('*')
        .eq('created_by', session.user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }

      console.log('Retrieved sessions:', sessions);

      if (!sessions) {
        console.log('No sessions found');
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
    enabled: !!session?.user?.id,
  });

  // Set up real-time subscription for session users
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('Setting up real-time subscription for session users...');
    const channel = supabase
      .channel('session-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'SessionUsers'
        },
        (payload) => {
          console.log('Session users change detected:', payload);
          // Invalidate the query to refetch the updated data
          queryClient.invalidateQueries({ queryKey: ['admin-sessions', session.user.id] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up session users subscription');
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, queryClient]);

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