
import { useParams } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JoinSessionForm } from '@/components/session/JoinSessionForm';
import { UserResponseForm } from '@/components/session/UserResponseForm';
import { WaitingPage } from '@/components/session/WaitingPage';
import { useEffect } from 'react';
import { Statement } from '@/types/statement';
import { Session } from '@/types/session';
import { useToast } from "@/hooks/use-toast";

const UserPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const { toast } = useToast();

  // Get user's localStorage name
  const storedName = localStorage.getItem(`session_${sessionId}_name`);

  // 1. Fetch session details
  const { 
    data: session,
    isLoading: isLoadingSession
  } = useQuery<Session>({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      
      const { data, error } = await supabase
        .from('SESSION')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // 2. Fetch user data if they've joined
  const {
    data: userData,
    isLoading: isLoadingUser
  } = useQuery({
    queryKey: ['user', sessionId, storedName],
    queryFn: async () => {
      if (!sessionId || !storedName) throw new Error('No stored user name found');
      
      const { data, error } = await supabase
        .from('SESSION_USERS')
        .select('*')
        .eq('session_id', sessionId)
        .eq('name', storedName)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!storedName,
  });

  // 3. Fetch current round and statement if session is started
  const {
    data: currentRound,
    isLoading: isLoadingRound
  } = useQuery({
    queryKey: ['active-round', sessionId, session?.has_active_round],
    queryFn: async () => {
      if (!sessionId || !session?.has_active_round) return null;

      // Get both round and statement data in a single query
      const { data, error } = await supabase
        .from('ROUND')
        .select(`
          *,
          STATEMENT!inner (
            id,
            statement,
            description
          )
        `)
        .eq('id', session.has_active_round)
        .single();

      if (error) throw error;

      // Transform the data to match our expected format
      if (data) {
        return {
          ...data,
          statement: data.STATEMENT
        };
      }
      return null;
    },
    enabled: !!sessionId && !!session?.has_active_round,
  });

  // 4. Fetch user's answer for current round
  const {
    data: userAnswer,
    isLoading: isLoadingAnswer
  } = useQuery({
    queryKey: ['user-answer', sessionId, userData?.id, session?.has_active_round],
    queryFn: async () => {
      if (!userData?.id || !session?.has_active_round) return null;

      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('respondant_id', userData.id)
        .eq('round_id', session.has_active_round)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows returned" error
      return data;
    },
    enabled: !!userData?.id && !!session?.has_active_round,
  });

  // Set up real-time subscriptions for updates
  useEffect(() => {
    if (!sessionId) return;

    // Subscribe to session changes
    const sessionChannel = supabase
      .channel('session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SESSION',
          filter: `id=eq.${sessionId}`,
        },
        () => {
          console.log('Session updated, refreshing...');
          window.location.reload();
        }
      )
      .subscribe();

    // Subscribe to round changes
    const roundChannel = supabase
      .channel('round-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ROUND',
          filter: `id=eq.${session?.has_active_round}`,
        },
        () => {
          console.log('Round updated, refreshing...');
          window.location.reload();
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(roundChannel);
    };
  }, [sessionId, session?.has_active_round]);

  // Loading states
  if (isLoadingSession || isLoadingUser || isLoadingRound || isLoadingAnswer) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-gray-600">Loading...</div>
      </div>
    );
  }

  // Error states
  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-red-500">Session not found</div>
      </div>
    );
  }

  // Session status checks
  if (session.status === 'UNPUBLISHED') {
    return (
      <div className="container mx-auto p-8">
        <div className="text-center text-yellow-500">
          This session is not currently active
        </div>
      </div>
    );
  }

  // Map statement for form props
  const getFormProps = (statement: Statement) => ({
    id: statement.id,
    content: statement.statement || '',
    status: 'STARTED'
  });

  // Main content render
  const renderContent = () => {
    // If session is published but user hasn't joined
    if (session.status === 'PUBLISHED' && !userData) {
      return <JoinSessionForm />;
    }

    // If session is started
    if (session.status === 'STARTED') {
      // Check if user has joined
      if (!userData) {
        return (
          <div className="text-center text-red-500">
            You need to join the session first
          </div>
        );
      }

      // Check for active round
      if (!session.has_active_round || !currentRound) {
        return (
          <div className="text-center text-gray-600">
            Waiting for the administrator to start a round...
          </div>
        );
      }

      // Check round status and user answer
      if (currentRound.status === 'STARTED' && currentRound.statement) {
        if (!userAnswer) {
          return (
            <UserResponseForm 
              statement={getFormProps(currentRound.statement)}
              onSubmit={() => {
                toast({
                  title: "Success",
                  description: "Your response has been submitted",
                });
                window.location.reload();
              }}
            />
          );
        } else {
          return <WaitingPage />;
        }
      }

      return (
        <div className="text-center text-gray-600">
          Waiting for the next statement...
        </div>
      );
    }

    return null;
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
      
      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default UserPage;
