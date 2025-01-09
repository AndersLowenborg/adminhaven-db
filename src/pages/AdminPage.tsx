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

  // Fetch sessions for the current user
  const { data: sessions, refetch: refetchSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from('Sessions')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

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
    // Navigate to a session management page (you'll need to create this)
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions?.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.name}</TableCell>
                  <TableCell>{session.status}</TableCell>
                  <TableCell>
                    {new Date(session.created_at).toLocaleDateString()}
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
              {!sessions?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
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