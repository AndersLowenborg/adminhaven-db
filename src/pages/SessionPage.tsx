
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
        .from('ANSWER')
        .select('*')
        .eq('round_id', sessionId);

      if (error) throw error;
      
      // Transform the answers into a map of statement_id -> answers[]
      const answersMap: Record<number, any[]> = {};
      data.forEach((answer) => {
        if (!answersMap[answer.round_id]) {
          answersMap[answer.round_id] = [];
        }
        answersMap[answer.round_id].push({
          agreement_level: answer.agreement_level,
          confidence_level: answer.confidence_level,
        });
      });
      
      return answersMap;
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscriptions for session:', sessionId);
    
    const sessionChannel = supabase
      .channel(`session-updates-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SESSION',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .subscribe();

    const statementsChannel = supabase
      .channel(`statements-updates-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'STATEMENT',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Statements update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
        }
      )
      .subscribe();

    const answersChannel = supabase
      .channel(`session-answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ANSWER',
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

  const handleStartRound = async (statementId: number) => {
    try {
      console.log('Starting round for statement:', statementId);
      
      if (session?.status === 'PUBLISHED') {
        console.log('Session status is published, updating to started');
        const { error: sessionError } = await supabase
          .from('SESSION')
          .update({ 
            status: 'STARTED',
            current_round: (session?.current_round || 0) + 1
          } as Partial<Session>)
          .eq('id', sessionId);

        if (sessionError) throw sessionError;
      }

      const { data: existingRounds, error: roundsError } = await supabase
        .from('ROUND')
        .select('round_number')
        .eq('statement_id', statementId)
        .order('round_number', { ascending: false })
        .limit(1);

      if (roundsError) throw roundsError;

      const nextRoundNumber = existingRounds && existingRounds.length > 0 
        ? existingRounds[0].round_number + 1 
        : 1;

      const { error: roundError } = await supabase
        .from('ROUND')
        .insert({
          statement_id: statementId,
          round_number: nextRoundNumber,
          status: 'STARTED',
          started_at: new Date().toISOString()
        });

      if (roundError) throw roundError;

      const { error: statementError } = await supabase
        .from('STATEMENT')
        .update({ status: 'ACTIVE' })
        .eq('id', statementId);

      if (statementError) throw statementError;

      toast({
        title: "Success",
        description: "Round started successfully",
      });
      
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
      
      const { error: roundError } = await supabase
        .from('ROUND')
        .update({ 
          status: 'ENDED',
          ended_at: new Date().toISOString()
        })
        .eq('statement_id', statementId)
        .eq('status', 'STARTED');

      if (roundError) throw roundError;

      const { error: statementError } = await supabase
        .from('STATEMENT')
        .update({ status: 'INACTIVE' })
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
      description: newBackground.trim() || undefined 
    });
    setNewStatement('');
    setNewBackground('');
    setIsAddingStatement(false);
  };

  const handleUpdateStatement = (id: number, content: string, description?: string) => {
    updateStatementMutation({ id, content, description });
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
    const firstInactiveStatement = statements?.find(s => s.status === 'INACTIVE');
    console.log('First inactive statement found:', firstInactiveStatement);
    if (firstInactiveStatement) {
      handleStartRound(firstInactiveStatement.id);
    } else {
      console.log('No inactive statements found');
    }
  };

  const handleHeaderEndRound = () => {
    const activeStatement = statements?.find(s => s.status === 'ACTIVE');
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
          onUpdateName={updateSession}
          onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['session', sessionId] })}
          onStartRound={handleHeaderStartRound}
          onEndRound={handleHeaderEndRound}
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
