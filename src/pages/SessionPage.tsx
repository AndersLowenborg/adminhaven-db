import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '@/hooks/use-session';
import { useStatements } from '@/hooks/use-statements';
import { useParticipants } from '@/hooks/use-participants';
import { useRounds } from '@/hooks/use-rounds';
import { useSessionSubscriptions } from '@/hooks/use-session-subscriptions';
import { SessionHeader } from '@/components/session/SessionHeader';
import { StatementsSection } from '@/components/session/StatementsSection';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SessionPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : 0;
  const [newStatement, setNewStatement] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [isAddingStatement, setIsAddingStatement] = useState(false);

  const { session, isLoadingSession, updateSession } = useSession(sessionId);
  const { 
    statements, 
    isLoadingStatements, 
    addStatement, 
    updateStatement: updateStatementMutation,
    deleteStatement,
    isAddingStatement: isAddingStatementPending,
    isDeletingStatement: isDeletingStatementPending,
  } = useStatements(sessionId);
  const { participants, isLoadingParticipants } = useParticipants(sessionId);
  const { startRound, endRound } = useRounds(sessionId);

  // Set up real-time subscriptions
  useSessionSubscriptions(sessionId);

  // Fetch active rounds to determine statement status
  const { data: activeRounds } = useQuery({
    queryKey: ['active-rounds', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ROUND')
        .select('*')
        .eq('status', 'STARTED');

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: answers } = useQuery({
    queryKey: ['answers', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('round_id', sessionId);

      if (error) throw error;
      
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

  const handleHeaderStartRound = () => {
    console.log('handleHeaderStartRound clicked - Statements:', statements);
    // Find first statement that doesn't have an active round
    const firstInactiveStatement = statements?.find(statement => 
      !activeRounds?.some(round => 
        round.statement_id === statement.id && round.status === 'STARTED'
      )
    );
    console.log('First inactive statement found:', firstInactiveStatement);
    if (firstInactiveStatement) {
      startRound({ statementId: firstInactiveStatement.id, session });
    } else {
      console.log('No inactive statements found');
    }
  };

  const handleHeaderEndRound = () => {
    // Find statement with active round
    const activeStatement = statements?.find(statement => 
      activeRounds?.some(round => 
        round.statement_id === statement.id && round.status === 'STARTED'
      )
    );
    if (activeStatement) {
      endRound(activeStatement.id);
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
          isAddingStatementPending={isAddingStatementPending}
          isDeletingStatementPending={isDeletingStatementPending}
          sessionStatus={session?.status || ''}
        />
      )}
    </div>
  );
};

export default SessionPage;
