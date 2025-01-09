import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SessionStatus = 'created' | 'published' | 'ongoing' | 'completed';

const SessionPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newStatement, setNewStatement] = React.useState('');
  const [isAddingStatement, setIsAddingStatement] = React.useState(false);

  // Fetch session details
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch statements for this session
  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Statements')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Add new statement
  const addStatementMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('Statements')
        .insert([
          {
            content,
            session_id: id,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', id] });
      setNewStatement('');
      setIsAddingStatement(false);
      toast({
        title: "Success",
        description: "Statement added successfully",
      });
    },
    onError: (error) => {
      console.error('Error adding statement:', error);
      toast({
        title: "Error",
        description: "Failed to add statement",
        variant: "destructive",
      });
    },
  });

  // Delete statement
  const deleteStatementMutation = useMutation({
    mutationFn: async (statementId: number) => {
      const { error } = await supabase
        .from('Statements')
        .delete()
        .eq('id', statementId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', id] });
      toast({
        title: "Success",
        description: "Statement deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting statement:', error);
      toast({
        title: "Error",
        description: "Failed to delete statement",
        variant: "destructive",
      });
    },
  });

  // Update session status
  const updateStatusMutation = useMutation({
    mutationFn: async (status: SessionStatus) => {
      const { error } = await supabase
        .from('Sessions')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      toast({
        title: "Success",
        description: "Session status updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating session status:', error);
      toast({
        title: "Error",
        description: "Failed to update session status",
        variant: "destructive",
      });
    },
  });

  if (isLoadingSession) {
    return <div className="container mx-auto p-8">Loading session...</div>;
  }

  if (!session) {
    return <div className="container mx-auto p-8">Session not found</div>;
  }

  const handleStatusChange = (status: SessionStatus) => {
    updateStatusMutation.mutate(status);
  };

  const handleAddStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) {
      toast({
        title: "Error",
        description: "Please enter a statement",
        variant: "destructive",
      });
      return;
    }
    addStatementMutation.mutate(newStatement);
  };

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{session.name}</h1>
          <p className="text-muted-foreground mt-2">
            Status: <span className="font-medium">{session.status}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleStatusChange('created')}
            disabled={session.status === 'created'}
          >
            Created
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange('published')}
            disabled={session.status === 'published'}
          >
            Published
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange('ongoing')}
            disabled={session.status === 'ongoing'}
          >
            Ongoing
          </Button>
          <Button
            variant="outline"
            onClick={() => handleStatusChange('completed')}
            disabled={session.status === 'completed'}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Statements</h2>
          <Button onClick={() => setIsAddingStatement(true)} disabled={isAddingStatement}>
            Add Statement
          </Button>
        </div>

        {isAddingStatement && (
          <form onSubmit={handleAddStatement} className="flex gap-4">
            <Input
              value={newStatement}
              onChange={(e) => setNewStatement(e.target.value)}
              placeholder="Enter statement content"
              className="flex-1"
            />
            <Button type="submit" disabled={addStatementMutation.isPending}>
              {addStatementMutation.isPending ? "Adding..." : "Add"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsAddingStatement(false);
                setNewStatement('');
              }}
            >
              Cancel
            </Button>
          </form>
        )}

        {isLoadingStatements ? (
          <div>Loading statements...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statement</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statements?.map((statement) => (
                <TableRow key={statement.id}>
                  <TableCell>{statement.content}</TableCell>
                  <TableCell>{statement.status}</TableCell>
                  <TableCell>
                    {new Date(statement.created_at || '').toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteStatementMutation.mutate(statement.id)}
                      disabled={deleteStatementMutation.isPending}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!statements?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No statements found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default SessionPage;