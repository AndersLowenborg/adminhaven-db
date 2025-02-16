
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
import { GroupPreparation } from '@/components/session/GroupPreparation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SessionPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : 0;
  const [newStatement, setNewStatement] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [isAddingStatement, setIsAddingStatement] = useState(false);
  const queryClient = useQueryClient();

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

  // Fetch answers for the current round
  const { data: answers } = useQuery({
    queryKey: ['round-answers', sessionId],
    queryFn: async () => {
      if (!session?.has_active_round) return [];
      
      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('round_id', session.has_active_round);

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!session?.has_active_round,
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

  const handleStartRound = (statementId: number) => {
    startRound({ statementId, session });
  };

  const handleEndRound = (statementId: number) => {
    endRound(statementId);
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
        onUpdateName={updateSession}
        onStatusChange={() => queryClient.invalidateQueries({ queryKey: ['session', sessionId] })}
        participants={participants || []}
      />

      <div className="space-y-8">
        <ParticipantsList 
          participants={participants || []} 
          sessionId={sessionId}
          queryKey={['participants', sessionId]}
        />

        <div className="mt-6">
          <GroupPreparation 
            participants={participants || []}
            answers={answers || []}
          />
        </div>

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
            onStartRound={handleStartRound}
            onEndRound={handleEndRound}
            activeRounds={activeRounds}
            sessionId={sessionId}
          />
        )}
      </div>
    </div>
  );
};

export default SessionPage;
