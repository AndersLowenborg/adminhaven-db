import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '@/hooks/use-session';
import { useStatements } from '@/hooks/use-statements';
import { useParticipants } from '@/hooks/use-participants';
import { SessionHeader } from '@/components/session/SessionHeader';
import { StatementsSection } from '@/components/session/StatementsSection';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Session } from '@/types/session';

const SessionPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : 0;
  const [newStatement, setNewStatement] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [isAddingStatement, setIsAddingStatement] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { session, isLoadingSession, updateSession } = useSession(sessionId);
  const { 
    statements, 
    isLoadingStatements, 
    addStatement, 
    updateStatement: updateStatementMutation,
    toggleStatementStatus,
    toggleShowResults,
    deleteStatement,
    startTimer,
    stopTimer,
    isAddingStatement: isAddingStatementPending,
    isDeletingStatement: isDeletingStatementPending,
  } = useStatements(sessionId);
  const { participants, isLoadingParticipants } = useParticipants(sessionId);

  const { data: answers } = useQuery({
    queryKey: ['answers', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Answers')
        .select(`
          *,
          statement:Statements(content)
        `)
        .eq('statement.session_id', sessionId);

      if (error) throw error;
      
      // Transform the answers into a map of statement_id -> answers[]
      const answersMap: Record<number, any[]> = {};
      data.forEach((answer) => {
        if (!answersMap[answer.statement_id]) {
          answersMap[answer.statement_id] = [];
        }
        answersMap[answer.statement_id].push({
          agreement_level: answer.agreement_level,
          confidence_level: answer.confidence_level,
        });
      });
      
      return answersMap;
    },
    enabled: !!sessionId,
  });

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

    // Add subscription for answers
    const answersChannel = supabase
      .channel(`session-answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Answers',
          filter: `statement.session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Answers update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['answers', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscriptions');
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(statementsChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [sessionId, queryClient]);

  const handleAllowJoinsChange = async (allow: boolean) => {
    try {
      console.log('Updating allow joins:', allow);
      const { error } = await supabase
        .from('Sessions')
        .update({ allow_joins: allow } as Partial<Session>)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: allow ? "Session opened to new joins" : "Session closed to new joins",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      console.error('Error updating allow joins:', error);
      toast({
        title: "Error",
        description: "Failed to update join settings",
        variant: "destructive",
      });
    }
  };

  const handleStartRound = async () => {
    try {
      console.log('Starting round for session:', sessionId);
      const { error } = await supabase
        .from('Sessions')
        .update({ 
          status: 'round_in_progress',
          allow_joins: false,
          current_round: (session?.current_round || 0) + 1
        } as Partial<Session>)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Round started successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      console.error('Error starting round:', error);
      toast({
        title: "Error",
        description: "Failed to start round",
        variant: "destructive",
      });
    }
  };

  const handleEndRound = async () => {
    try {
      console.log('Ending round for session:', sessionId);
      const newStatus = session?.current_round === Math.ceil(Math.log2((participants?.length || 0) / 3)) 
        ? 'completed' 
        : 'round_ended';
      
      const { error } = await supabase
        .from('Sessions')
        .update({ 
          status: newStatus,
          allow_joins: false
        } as Partial<Session>)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: newStatus === 'completed' ? "Session completed successfully" : "Round ended successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      console.error('Error ending round:', error);
      toast({
        title: "Error",
        description: "Failed to end round",
        variant: "destructive",
      });
    }
  };

  const handleGenerateGroups = async () => {
    try {
      console.log('Generating groups for session:', sessionId);
      const { error } = await supabase
        .from('Sessions')
        .update({ 
          status: 'published',
          current_round: (session?.current_round || 0) + 1,
          allow_joins: false
        } as Partial<Session>)
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Groups generated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
    } catch (error) {
      console.error('Error generating groups:', error);
      toast({
        title: "Error",
        description: "Failed to generate groups",
        variant: "destructive",
      });
    }
  };

  const handleTestModeChange = async (enabled: boolean) => {
    try {
      console.log('Updating test mode:', enabled);
      const { error } = await supabase
        .from('Sessions')
        .update({ 
          test_mode: enabled,
          test_participants_count: enabled ? 5 : 0
        } as Partial<Session>)
        .eq('id', sessionId);

      if (error) throw error;

      if (enabled) {
        // Create test participants
        const testParticipants = Array.from({ length: 5 }, (_, i) => ({
          session_id: sessionId,
          name: `Test Participant ${i + 1}`,
          is_test_participant: true
        }));

        const { error: participantsError } = await supabase
          .from('SessionUsers')
          .insert(testParticipants);

        if (participantsError) throw participantsError;
      } else {
        // Remove test participants
        const { error: deleteError } = await supabase
          .from('SessionUsers')
          .delete()
          .eq('session_id', sessionId)
          .eq('is_test_participant', true);

        if (deleteError) throw deleteError;
      }

      toast({
        title: "Success",
        description: enabled ? "Test mode enabled" : "Test mode disabled",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['participants', sessionId] });
    } catch (error) {
      console.error('Error updating test mode:', error);
      toast({
        title: "Error",
        description: "Failed to update test mode",
        variant: "destructive",
      });
    }
  };

  const handleTestParticipantsCountChange = async (count: number) => {
    try {
      console.log('Updating test participants count:', count);
      
      // Update session
      const { error: sessionError } = await supabase
        .from('Sessions')
        .update({ test_participants_count: count } as Partial<Session>)
        .eq('id', sessionId);

      if (sessionError) throw sessionError;

      // Remove existing test participants
      const { error: deleteError } = await supabase
        .from('SessionUsers')
        .delete()
        .eq('session_id', sessionId)
        .eq('is_test_participant', true);

      if (deleteError) throw deleteError;

      // Create new test participants with unique names using timestamp
      const timestamp = Date.now();
      const testParticipants = Array.from({ length: count }, (_, i) => ({
        session_id: sessionId,
        name: `Test Participant ${i + 1}-${timestamp}`,
        is_test_participant: true
      }));

      const { error: participantsError } = await supabase
        .from('SessionUsers')
        .insert(testParticipants);

      if (participantsError) throw participantsError;

      toast({
        title: "Success",
        description: "Test participants updated",
      });
      
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['participants', sessionId] });
    } catch (error) {
      console.error('Error updating test participants:', error);
      toast({
        title: "Error",
        description: "Failed to update test participants",
        variant: "destructive",
      });
    }
  };

  const handleAddStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;
    addStatement({ 
      content: newStatement,
      background: newBackground.trim() || undefined 
    });
    setNewStatement('');
    setNewBackground('');
    setIsAddingStatement(false);
  };

  const handleUpdateStatement = (id: number, content: string, background?: string) => {
    updateStatementMutation({ id, content, background });
  };

  const handleToggleStatementStatus = (id: number, currentStatus: string) => {
    console.log('Toggling statement status:', id, 'Current status:', currentStatus);
    toggleStatementStatus({ id, currentStatus });
  };

  const handleToggleShowResults = (id: number, currentShowResults: boolean) => {
    console.log('Toggling show results:', id, 'Current show results:', currentShowResults);
    toggleShowResults({ id, currentShowResults });
  };

  const handleStartTimer = async (id: number, seconds: number) => {
    startTimer({ id, seconds });
  };

  const handleStopTimer = async (id: number) => {
    stopTimer(id);
  };

  if (!sessionId) {
    return <div className="container mx-auto p-8">Invalid session ID</div>;
  }

  if (isLoadingSession || isLoadingParticipants) {
    return <div className="container mx-auto p-8">Loading session...</div>;
  }

  if (!session) {
    return <div className="container mx-auto p-8">Session not found</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <SessionHeader 
          name={session?.name || ''} 
          status={session?.status || ''}
          sessionId={sessionId}
          hasStatements={statements?.length > 0}
          participantCount={participants?.length || 0}
          testMode={session?.test_mode || false}
          testParticipantsCount={session?.test_participants_count || 0}
          allowJoins={session?.allow_joins || false}
          currentRound={session?.current_round || 0}
          onUpdateName={updateSession}
          onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['session', sessionId] })}
          onStartRound={handleStartRound}
          onEndRound={handleEndRound}
          onGenerateGroups={handleGenerateGroups}
          onTestModeChange={handleTestModeChange}
          onTestParticipantsCountChange={handleTestParticipantsCountChange}
          onAllowJoinsChange={handleAllowJoinsChange}
        />
      </div>

      <ParticipantsList 
        participants={participants || []} 
        sessionId={sessionId.toString()}
        queryKey={['participants', sessionId]}
      />

      {isLoadingStatements ? (
        <div>Loading statements...</div>
      ) : (
        <StatementsSection
          statements={statements || []}
          isAddingStatement={isAddingStatement}
          newStatement={newStatement}
          newBackground={newBackground}
          onNewStatementChange={setNewStatement}
          onNewBackgroundChange={setNewBackground}
          onAddClick={() => setIsAddingStatement(true)}
          onCancelAdd={() => {
            setIsAddingStatement(false);
            setNewStatement('');
            setNewBackground('');
          }}
          onSubmitStatement={handleAddStatement}
          onDeleteStatement={deleteStatement}
          onUpdateStatement={handleUpdateStatement}
          onToggleStatementStatus={handleToggleStatementStatus}
          onToggleShowResults={handleToggleShowResults}
          isAddingStatementPending={isAddingStatementPending}
          isDeletingStatementPending={isDeletingStatementPending}
          onStartTimer={handleStartTimer}
          onStopTimer={handleStopTimer}
          sessionStatus={session?.status || ''}
        />
      )}
    </div>
  );
};

export default SessionPage;
