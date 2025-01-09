import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { SessionHeader } from '@/components/session/SessionHeader';
import { StatementsSection } from '@/components/session/StatementsSection';
import { ParticipantsList } from '@/components/session/ParticipantsList';

const SessionPage = () => {
  const { id } = useParams();
  const sessionId = id ? parseInt(id, 10) : undefined;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newStatement, setNewStatement] = React.useState('');
  const [isAddingStatement, setIsAddingStatement] = React.useState(false);

  // Fetch session details
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      console.log('Fetching session details for ID:', sessionId);
      const { data, error } = await supabase
        .from('Sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      console.log('Session details:', data);
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch participants for this session
  const { data: participants, isLoading: isLoadingParticipants } = useQuery({
    queryKey: ['participants', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      console.log('Fetching participants for session:', sessionId);
      const { data, error } = await supabase
        .from('SessionUsers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      console.log('Participants data:', data);
      return data || [];
    },
    enabled: !!sessionId,
  });

  // Set up real-time subscription for participants
  React.useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up participants subscription for session:', sessionId);
    const channel = supabase
      .channel('session-participants')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SessionUsers',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Participants change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['participants', sessionId] });
        }
      )
      .subscribe((status) => {
        console.log('Participants subscription status:', status);
      });

    return () => {
      console.log('Cleaning up participants subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  // Fetch statements for this session
  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('Statements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Update session name
  const updateSessionMutation = useMutation({
    mutationFn: async (newName: string) => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('Sessions')
        .update({ name: newName })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      toast({
        title: "Success",
        description: "Session name updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating session:', error);
      toast({
        title: "Error",
        description: "Failed to update session name",
        variant: "destructive",
      });
    },
  });

  // Add new statement
  const addStatementMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('Statements')
        .insert([
          {
            content,
            session_id: sessionId,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
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

  // Update statement
  const updateStatementMutation = useMutation({
    mutationFn: async ({ id, content }: { id: number; content: string }) => {
      const { data, error } = await supabase
        .from('Statements')
        .update({ content })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
      toast({
        title: "Success",
        description: "Statement updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating statement:', error);
      toast({
        title: "Error",
        description: "Failed to update statement",
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
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
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

  if (!sessionId) {
    return <div className="container mx-auto p-8">Invalid session ID</div>;
  }

  if (isLoadingSession || isLoadingParticipants) {
    return <div className="container mx-auto p-8">Loading session...</div>;
  }

  if (!session) {
    return <div className="container mx-auto p-8">Session not found</div>;
  }

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

  const handleStatusChange = () => {
    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <SessionHeader 
          name={session.name} 
          status={session.status} 
          sessionId={session.id}
          hasStatements={statements?.length > 0}
          onUpdateName={(newName) => updateSessionMutation.mutate(newName)}
          onStatusChange={handleStatusChange}
        />
      </div>

      <ParticipantsList participants={participants || []} />

      {isLoadingStatements ? (
        <div>Loading statements...</div>
      ) : (
        <StatementsSection
          statements={statements || []}
          isAddingStatement={isAddingStatement}
          newStatement={newStatement}
          onNewStatementChange={setNewStatement}
          onAddClick={() => setIsAddingStatement(true)}
          onCancelAdd={() => {
            setIsAddingStatement(false);
            setNewStatement('');
          }}
          onSubmitStatement={handleAddStatement}
          onDeleteStatement={(id) => deleteStatementMutation.mutate(id)}
          onUpdateStatement={(id, content) => updateStatementMutation.mutate({ id, content })}
          isAddingStatementPending={addStatementMutation.isPending}
          isDeletingStatementPending={deleteStatementMutation.isPending}
        />
      )}
    </div>
  );
};

export default SessionPage;
