
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JoinSessionForm } from '@/components/session/JoinSessionForm';
import { UserResponseForm } from '@/components/session/UserResponseForm';
import { WaitingPage } from '@/components/session/WaitingPage';
import { useEffect } from 'react';
import { Statement } from '@/types/statement';

const UserPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const queryClient = useQueryClient();

  // Get user's localStorage name to fetch the correct user data
  const storedName = localStorage.getItem(`session_${sessionId}_name`);
  console.log('Stored name from localStorage:', storedName);

  // Fetch session details to verify it's published
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      console.log('Fetching session details for user page:', sessionId);
      const { data, error } = await supabase
        .from('SESSION')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      console.log('Session details retrieved:', data);
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch statements when session is started
  const { data: statements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('STATEMENT')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data as Statement[];
    },
    enabled: !!sessionId && session?.status === 'STARTED',
  });

  // Fetch active statement using session.has_active_round
  const { data: activeStatement } = useQuery({
    queryKey: ['active-statement', sessionId, session?.has_active_round],
    queryFn: async () => {
      if (!sessionId || !session?.has_active_round) return null;
      
      console.log('Fetching active statement for round:', session.has_active_round);
      
      const { data: round, error: roundError } = await supabase
        .from('ROUND')
        .select('statement_id')
        .eq('id', session.has_active_round)
        .single();

      if (roundError) throw roundError;

      if (!round?.statement_id) return null;

      const { data: statement, error: statementError } = await supabase
        .from('STATEMENT')
        .select('*')
        .eq('id', round.statement_id)
        .single();

      if (statementError) throw statementError;
      return statement;
    },
    enabled: !!sessionId && !!session?.has_active_round,
  });

  // Fetch user information using the stored name
  const { data: userData } = useQuery({
    queryKey: ['user', sessionId, storedName],
    queryFn: async () => {
      if (!sessionId || !storedName) throw new Error('Session ID and name are required');
      console.log('Fetching user data with name:', storedName);
      
      const { data, error } = await supabase
        .from('SESSION_USERS')
        .select('*')
        .eq('session_id', sessionId)
        .eq('name', storedName)
        .maybeSingle();

      if (error) throw error;
      console.log('User data retrieved:', data);
      return data;
    },
    enabled: !!sessionId && !!storedName,
  });

  // Fetch user's answers to check progress
  const { data: userAnswers } = useQuery({
    queryKey: ['userAnswers', sessionId, userData?.id, session?.has_active_round],
    queryFn: async () => {
      if (!sessionId || !userData?.id || !session?.has_active_round) return null;
      
      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('respondant_id', userData.id)
        .eq('round_id', session.has_active_round)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!userData?.id && !!session?.has_active_round,
  });

  // Set up real-time subscription for session status changes
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for session status:', sessionId);
    
    const channel = supabase
      .channel(`session-status-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'SESSION',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session status changed:', payload);
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['active-statement', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['userAnswers', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient, storedName]);

  if (isLoadingSession) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center text-red-500">Session not found</p>
      </div>
    );
  }

  if (session.status === 'UNPUBLISHED') {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center text-yellow-500">This session is not currently active</p>
      </div>
    );
  }

  // Map the Statement type to what UserResponseForm expects
  const mapStatementToFormProps = (statement: Statement) => {
    return {
      id: statement.id,
      content: statement.statement || '',
      status: session.has_active_round ? 'STARTED' : 'NOT_STARTED'
    };
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {session.status === 'STARTED' ? session.name : `Join Session: ${session.name}`}
      </h1>

      {userData?.name && (
        <p className="text-center text-lg mb-6">
          Welcome, <span className="font-semibold">{userData.name}</span>!
        </p>
      )}
      
      {/* Show join form if session is published but user hasn't joined */}
      {session.status === 'PUBLISHED' && !userData && <JoinSessionForm />}
      
      {/* Show statement form or waiting page based on session state */}
      {session.status === 'STARTED' && (
        <div className="mt-8">
          {!userData ? (
            <div className="text-center text-red-500">
              You need to join the session first
            </div>
          ) : activeStatement ? (
            !userAnswers ? (
              <UserResponseForm 
                statement={mapStatementToFormProps(activeStatement)}
                onSubmit={() => {
                  queryClient.invalidateQueries({ 
                    queryKey: ['userAnswers', sessionId, userData.id, session.has_active_round] 
                  });
                }}
              />
            ) : (
              <WaitingPage />
            )
          ) : (
            <WaitingPage />
          )}
        </div>
      )}
    </div>
  );
};

export default UserPage;
