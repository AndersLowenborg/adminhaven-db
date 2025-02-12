
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

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

  const handleStartRound = async (statementId: number) => {
    try {
      console.log('Starting round for statement:', statementId);
      
      // First update the session status to 'started' if it's not already
      if (session?.status === 'published') {
        console.log('Session status is published, updating to started');
        const { error: sessionError } = await supabase
          .from('Sessions')
          .update({ 
            status: 'started',
            current_round: (session?.current_round || 0) + 1,
            allow_joins: false 
          } as Partial<Session>)
          .eq('id', sessionId);

        if (sessionError) throw sessionError;
      }

      // Get the current round number for this statement
      const { data: existingRounds, error: roundsError } = await supabase
        .from('Rounds')
        .select('round_number')
        .eq('statement_id', statementId)
        .order('round_number', { ascending: false })
        .limit(1);

      if (roundsError) throw roundsError;

      const nextRoundNumber = existingRounds && existingRounds.length > 0 
        ? existingRounds[0].round_number + 1 
        : 1;

      // Create a new round for this statement
      const { error: roundError } = await supabase
        .from('Rounds')
        .insert({
          statement_id: statementId,
          round_number: nextRoundNumber,
          status: 'in_progress',
          started_at: new Date().toISOString()
        });

      if (roundError) throw roundError;

      // Update the statement status to active
      const { error: statementError } = await supabase
        .from('Statements')
        .update({ status: 'active' })
        .eq('id', statementId);

      if (statementError) throw statementError;

      toast({
        title: "Success",
        description: "Round started successfully",
      });
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
    } catch (error) {
      console.error('Error starting round:', error);
      toast({
        title: "Error",
        description: "Failed to start round",
        variant: "destructive",
      });
    }
  };

  const handleEndRound = async (statementId: number) => {
    try {
      console.log('Ending round for statement:', statementId);
      
      // Update the current round status to ended
      const { error: roundError } = await supabase
        .from('Rounds')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('statement_id', statementId)
        .eq('status', 'in_progress');

      if (roundError) throw roundError;

      // Update the statement status back to inactive
      const { error: statementError } = await supabase
        .from('Statements')
        .update({ status: 'inactive' })
        .eq('id', statementId);

      if (statementError) throw statementError;

      toast({
        title: "Success",
        description: "Round ended successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
    } catch (error) {
      console.error('Error ending round:', error);
      toast({
        title: "Error",
        description: "Failed to end round",
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

  const handleHeaderStartRound = () => {
    console.log('handleHeaderStartRound clicked - Statements:', statements);
    // Choose the first inactive statement to start
    const firstInactiveStatement = statements?.find(s => s.status === 'inactive');
    console.log('First inactive statement found:', firstInactiveStatement);
    if (firstInactiveStatement) {
      handleStartRound(firstInactiveStatement.id);
    } else {
      console.log('No inactive statements found');
    }
  };

  const handleHeaderEndRound = () => {
    // Find the active statement and end its round
    const activeStatement = statements?.find(s => s.status === 'active');
    if (activeStatement) {
      handleEndRound(activeStatement.id);
    }
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
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          className="mb-4"
        >
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <SessionHeader 
          name={session?.name || ''} 
          status={session?.status || ''}
          sessionId={sessionId}
          hasStatements={statements?.length > 0}
          participantCount={participants?.length || 0}
          allowJoins={session?.allow_joins || false}
          currentRound={session?.current_round || 0}
          onUpdateName={updateSession}
          onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['session', sessionId] })}
          onStartRound={handleHeaderStartRound}
          onEndRound={handleHeaderEndRound}
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
