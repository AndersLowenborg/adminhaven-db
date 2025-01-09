import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const AdminPage = () => {
  const user = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sessions with their users
  const { data: sessionsWithUsers, isLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: async () => {
      if (!user) throw new Error('No user');

      console.log('Fetching sessions for user:', user.id);
      
      // First get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('Sessions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
        throw sessionsError;
      }
      console.log('Retrieved sessions:', sessions);

      // Then get all users for these sessions
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

      return sessionsWithUsers;
    },
    enabled: !!user,
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
          // Refetch sessions to update the UI
          queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
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

  if (!user) {
    return (
      <div className="container mx-auto p-8">
        Please log in to access the admin page.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-8">
        Loading sessions...
      </div>
    );
  }

  const handleCreateSession = async () => {
    try {
      const { data: session, error } = await supabase
        .from('Sessions')
        .insert([
          {
            name: 'New Session',
            status: 'draft',
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

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
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleCreateSession}>Create New Session</Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[200px]">Participants</TableHead>
              <TableHead>Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionsWithUsers?.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/session/${session.id}`)}
              >
                <TableCell className="font-medium">{session.name}</TableCell>
                <TableCell>
                  <Badge variant={session.status === 'draft' ? 'secondary' : 'default'}>
                    {session.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {session.users && session.users.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {session.users.map((user) => (
                        <Badge 
                          key={user.id} 
                          variant="secondary"
                        >
                          {user.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No participants yet</span>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(session.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPage;