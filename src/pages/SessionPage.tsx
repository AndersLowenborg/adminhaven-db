import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '@/hooks/use-session';
import { useStatements } from '@/hooks/use-statements';
import { useParticipants } from '@/hooks/use-participants';
import { SessionHeader } from '@/components/session/SessionHeader';
import { StatementsSection } from '@/components/session/StatementsSection';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SessionPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : 0;
  const [newStatement, setNewStatement] = useState('');
  const [isAddingStatement, setIsAddingStatement] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { session, isLoadingSession, updateSession } = useSession(sessionId);
  const { 
    statements, 
    isLoadingStatements, 
    addStatement, 
    updateStatement: updateStatementMutation,
    toggleLock,
    moveToNext,
    deleteStatement,
    isAddingStatement: isAddingStatementPending,
    isDeletingStatement: isDeletingStatementPending,
  } = useStatements(sessionId);
  const { participants, isLoadingParticipants } = useParticipants(sessionId);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscriptions for session:', sessionId);
    
    // Channel for session updates
    const sessionChannel = supabase
      .channel(`session-updates-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .subscribe();

    // Channel for statements updates
    const statementsChannel = supabase
      .channel(`statements-updates-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Statements',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Statements update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(statementsChannel);
    };
  }, [sessionId, queryClient]);

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
    if (!newStatement.trim()) return;
    addStatement(newStatement);
    setNewStatement('');
    setIsAddingStatement(false);
  };

  const handleUpdateStatement = (id: number, content: string) => {
    updateStatementMutation({ id, content });
  };

  const handleToggleLock = (id: number, currentStatus: string) => {
    console.log('Toggling lock for statement:', id, 'Current status:', currentStatus);
    toggleLock({ id, currentStatus });
  };

  const handleMoveToNext = (currentId: number) => {
    console.log('Moving to next statement from:', currentId);
    moveToNext(currentId);
  };

  const handleStatusChange = () => {
    queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
  };

  const handleStartSession = async () => {
    try {
      console.log('Starting session:', sessionId);
      const { error } = await supabase
        .from('Sessions')
        .update({ status: 'started' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session started successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    }
  };

  const handleEndSession = async () => {
    try {
      console.log('Ending session:', sessionId);
      const { error } = await supabase
        .from('Sessions')
        .update({ status: 'ended' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session ended successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <SessionHeader 
          name={session?.name || ''} 
          status={session?.status || ''} 
          sessionId={sessionId}
          hasStatements={statements?.length > 0}
          participantCount={participants?.length || 0}
          onUpdateName={updateSession}
          onStatusChange={handleStatusChange}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
        />
      </div>

      <ParticipantsList 
        participants={participants || []} 
        sessionId={sessionId}
        queryKey={['participants', sessionId]}
      />

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
          onDeleteStatement={deleteStatement}
          onUpdateStatement={handleUpdateStatement}
          onToggleLock={handleToggleLock}
          onMoveToNext={handleMoveToNext}
          isAddingStatementPending={isAddingStatementPending}
          isDeletingStatementPending={isDeletingStatementPending}
        />
      )}
    </div>
  );
};

export default SessionPage;
