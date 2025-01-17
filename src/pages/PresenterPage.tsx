import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { Badge } from '@/components/ui/badge';

type Answer = {
  id: number;
  content: string;
  created_at: string;
  statement_id: number;
  user_id: number;
  statement: {
    content: string;
  };
};

type Statement = {
  id: number;
  content: string;
  created_at: string;
  status: string;
};

const PresenterPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const [answers, setAnswers] = useState<Answer[]>([]);
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';

  // Fetch session data
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['presenter-session', sessionId],
    queryFn: async () => {
      console.log('Checking session status for ID:', sessionId);
      const { data, error } = await supabase
        .from('Sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }

      console.log('Session data:', data);
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch statements for the session
  const { data: statements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Statements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Statement[];
    },
    enabled: !!sessionId,
  });

  // Fetch current answers
  const { data: currentAnswers, refetch: refetchAnswers } = useQuery({
    queryKey: ['presenter-answers', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Answers')
        .select(`
          *,
          statement:Statements(content)
        `)
        .eq('statement.session_id', sessionId);

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch session users
  const { data: sessionUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['session-users', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SessionUsers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId || session?.status !== 'started') return;

    console.log('Setting up real-time subscription for answers...');
    const answersChannel = supabase
      .channel('answers-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'Answers',
          filter: `statement_id=eq.${getCurrentStatementId()}`
        },
        () => {
          console.log('Answer change detected, refetching...');
          refetchAnswers();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(answersChannel);
    };
  }, [sessionId, session?.status, refetchAnswers]);

  const getCurrentStatementId = () => {
    if (!statements?.length) return null;
    return statements[0]?.id; // For now, just show the first statement
  };

  const getCurrentStatement = () => {
    if (!statements?.length) return null;
    return statements[0]; // For now, just show the first statement
  };

  const getRespondedUsers = () => {
    if (!currentAnswers || !sessionUsers) return [];
    const currentStatementId = getCurrentStatementId();
    if (!currentStatementId) return [];

    return sessionUsers.map(user => ({
      ...user,
      hasResponded: currentAnswers.some(
        answer => answer.statement_id === currentStatementId
      )
    }));
  };

  if (isSessionLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-gray-600">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-red-600">Session not found</p>
      </div>
    );
  }

  const currentStatement = getCurrentStatement();
  const respondedUsers = getRespondedUsers();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Presenter Dashboard</h1>
      
      {session.status === 'started' && currentStatement && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Statement</h2>
          <p className="text-lg mb-4">{currentStatement.content}</p>
          
          <div className="mt-4">
            <h3 className="font-medium mb-2">Responses:</h3>
            <div className="flex flex-wrap gap-2">
              {respondedUsers.map(user => (
                <Badge 
                  key={user.id}
                  variant={user.hasResponded ? "default" : "secondary"}
                  className="text-sm py-1 px-3"
                >
                  {user.name} {user.hasResponded ? '✓' : ''}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      )}
      
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Session Information</h2>
        <div className="flex items-start gap-8">
          <div className="flex-1">
            <p className="mb-2">Share this link with participants:</p>
            <input
              type="text"
              value={sessionUrl}
              readOnly
              className="w-full p-2 border rounded bg-gray-50"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
          <div className="flex-shrink-0">
            <QRCodeSVG value={sessionUrl} size={200} />
          </div>
        </div>
      </Card>

      {sessionUsers && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Participants</h2>
          <div className="flex flex-wrap gap-2">
            {sessionUsers.map(user => (
              <Badge 
                key={user.id}
                variant="secondary"
                className="text-sm py-1 px-3"
              >
                {user.name}
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PresenterPage;