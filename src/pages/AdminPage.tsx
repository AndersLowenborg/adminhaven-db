import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sessionName, setSessionName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Fetch sessions and their users for the current user
  const { data: sessionsWithUsers, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions-with-users'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      console.log('Fetching sessions for user:', user.id);

      // First get all sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('Sessions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      console.log('Retrieved sessions:', sessions);

      // Then get all users for these sessions
      const sessionsWithUsers = await Promise.all(
        sessions.map(async (session) => {
          console.log('Fetching users for session:', session.id);
          const { data: users, error: usersError } = await supabase
            .from('SessionUsers')
            .select('*')
            .eq('session_id', session.id);

          if (usersError) throw usersError;
          console.log('Retrieved users for session', session.id, ':', users);

          return {
            ...session,
            users: users || []
          };
        })
      );

      console.log('Final sessions with users:', sessionsWithUsers);
      return sessionsWithUsers;
    },
  });

  // Set up real-time subscription for session users
  React.useEffect(() => {
    console.log('Setting up real-time subscription for session users...');
    const channel = supabase
      .channel('admin-session-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SessionUsers'
        },
        (payload) => {
          console.log('Session users change detected:', payload);
          refetchSessions();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up admin session users subscription');
      supabase.removeChannel(channel);
    };
  }, [refetchSessions]);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from('Sessions')
        .insert([
          { 
            name: sessionName.trim(),
            status: 'created',
            created_by: user.id
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session created successfully",
      });
      
      console.log('Created session:', data);
      setSessionName('');
      refetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSession = (sessionId: number) => {
    navigate(`/admin/session/${sessionId}`);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button onClick={handleLogout} variant="outline">
          Sign Out
        </Button>
      </div>
      
      <div className="space-y-8">
        {/* Create new session section */}
        <div className="max-w-md space-y-4">
          <h2 className="text-xl font-semibold">Create New Session</h2>
          <div className="flex gap-4">
            <Input
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Enter session name"
              disabled={isLoading}
            />
            <Button 
              onClick={handleCreateSession}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>

        {/* Sessions list section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Sessions</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="min-w-[200px]">Participants</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessionsWithUsers?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.name}</TableCell>
                  <TableCell>{session.status}</TableCell>
                  <TableCell>
                    {new Date(session.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {session.users && session.users.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {session.users.map((user, index) => (
                          <span 
                            key={user.id} 
                            className="bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-sm"
                          >
                            {user.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No participants yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleOpenSession(session.id)}
                      variant="secondary"
                      size="sm"
                    >
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!sessionsWithUsers?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sessions found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;