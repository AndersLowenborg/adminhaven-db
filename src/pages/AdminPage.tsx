import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { SessionsTable } from '@/components/admin/SessionsTable';

const AdminPage = () => {
  const user = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check authentication and redirect if not logged in
  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication status...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (!session) {
        console.log('No active session found, redirecting to login');
        navigate('/login');
        return;
      }
      console.log('Active session found for user:', session.user.id);
    };
    
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, 'Session:', session?.user?.id);
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or session expired, redirecting to login');
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Fetch sessions with their users
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

  // Set up real-time subscription for session users
  React.useEffect(() => {
    if (!user) return;

    console.log('Setting up admin session users subscription');
    
    const channel = supabase
      .channel('admin-session-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SessionUsers',
        },
        (payload) => {
          console.log('SessionUsers change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['admin-sessions', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up admin session users subscription');
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

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
      
      const { data: newSession, error: createError } = await supabase
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
        toast({
          title: "Success",
          description: "Session created successfully",
        });
        // Invalidate the sessions query to refresh the list
        await queryClient.invalidateQueries({ queryKey: ['admin-sessions', user.id] });
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

  if (error) {
    console.error('Error loading sessions:', error);
    toast({
      title: "Error",
      description: "Failed to load sessions. Please try refreshing the page.",
      variant: "destructive",
    });
  }

  return (
    <div className="container mx-auto p-8">
      <AdminHeader />
      <div className="flex justify-end mb-8">
        <Button onClick={handleCreateSession}>Create New Session</Button>
      </div>
      {isLoading ? (
        <div className="text-center py-8">Loading sessions...</div>
      ) : (
        <SessionsTable sessions={sessionsWithUsers || []} />
      )}
    </div>
  );
};

export default AdminPage;