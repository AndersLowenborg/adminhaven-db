
import { useParams } from 'react-router-dom';
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { JoinSessionForm } from '@/components/session/JoinSessionForm';
import { UserResponseForm } from '@/components/session/UserResponseForm';
import { useEffect, useState } from 'react';

const UserPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);

  // Fetch session details to verify it's published
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      console.log('Fetching session details for user page:', sessionId);
      const { data, error } = await supabase
        .from('Sessions')
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
        .from('Statements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && session?.status === 'started',
  });

  // Fetch user information
  const { data: userData } = useQuery({
    queryKey: ['user', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('SessionUsers')
        .select('name')
        .eq('session_id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && session?.status === 'started',
  });

  // Set up real-time subscription for session status changes
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel('session-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Session status changed:', payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

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

  if (session.status === 'unpublished') {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center text-yellow-500">This session is not currently active</p>
      </div>
    );
  }

  const handleResponseSubmit = () => {
    if (statements && currentStatementIndex < statements.length - 1) {
      setCurrentStatementIndex(prev => prev + 1);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        {session.status === 'started' ? session.name : `Join Session: ${session.name}`}
      </h1>

      {userData?.name && (
        <p className="text-center text-lg mb-6">
          Welcome, <span className="font-semibold">{userData.name}</span>!
        </p>
      )}
      
      {session.status === 'published' && <JoinSessionForm />}
      
      {session.status === 'started' && statements && statements.length > 0 && (
        <div className="mt-8">
          <p className="text-center mb-4">
            Statement {currentStatementIndex + 1} of {statements.length}
          </p>
          <UserResponseForm 
            statement={statements[currentStatementIndex]}
            onSubmit={handleResponseSubmit}
          />
        </div>
      )}
    </div>
  );
};

export default UserPage;
