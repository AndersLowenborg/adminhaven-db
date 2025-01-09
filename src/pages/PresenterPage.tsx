import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';

type Answer = {
  id: number;
  content: string;
  created_at: string;
  statement_id: number;
  statement: {
    content: string;
  };
};

const PresenterPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const [answers, setAnswers] = useState<Answer[]>([]);
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';

  // First check if the session exists and is published
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

  // Fetch answers with their corresponding statements
  const { data: initialAnswers, isLoading: isAnswersLoading } = useQuery({
    queryKey: ['answers', sessionId],
    queryFn: async () => {
      console.log('Fetching answers...');
      const { data, error } = await supabase
        .from('Answers')
        .select(`
          *,
          statement:Statements(content)
        `)
        .eq('statement.session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching answers:', error);
        throw error;
      }
      
      console.log('Fetched answers:', data);
      return data as Answer[];
    },
    enabled: !!sessionId && session?.status === 'published',
  });

  // Fetch session users with real-time updates
  const { data: sessionUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['session-users', sessionId],
    queryFn: async () => {
      console.log('Fetching session users...');
      const { data, error } = await supabase
        .from('SessionUsers')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      console.log('Fetched session users:', data);
      return data;
    },
    enabled: !!sessionId && session?.status === 'published',
  });

  useEffect(() => {
    if (initialAnswers) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  // Set up real-time subscription for session users
  useEffect(() => {
    if (!sessionId || session?.status !== 'published') return;

    console.log('Setting up real-time subscription for session users...');
    const channel = supabase
      .channel('session-users-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'SessionUsers',
          filter: `session_id=eq.${sessionId}`
        },
        async (payload) => {
          console.log('New session user detected:', payload);
          refetchUsers();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up session users subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, refetchUsers, session?.status]);

  // Set up real-time subscription for new answers
  useEffect(() => {
    if (!sessionId || session?.status !== 'published') return;

    console.log('Setting up real-time subscription for answers...');
    const channel = supabase
      .channel('answers-changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Answers' 
        },
        async (payload) => {
          console.log('New answer received:', payload);
          const { data, error } = await supabase
            .from('Answers')
            .select(`
              *,
              statement:Statements(content)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching new answer details:', error);
            return;
          }

          console.log('Fetched new answer details:', data);
          setAnswers(prev => [data as Answer, ...prev]);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up answers subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, session?.status]);

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

  if (session.status !== 'published') {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-red-600">This session is currently not active</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Presenter Dashboard</h1>
      
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
            {sessionUsers && (
              <div className="mt-4">
                <p className="font-medium mb-2">Participants ({sessionUsers.length}):</p>
                <ul className="list-disc list-inside">
                  {sessionUsers.map(user => (
                    <li key={user.id} className="text-gray-700">{user.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <QRCodeSVG value={sessionUrl} size={200} />
          </div>
        </div>
      </Card>
      
      <div className="grid gap-4">
        {answers.length === 0 ? (
          <p className="text-gray-600 text-center">No answers submitted yet.</p>
        ) : (
          answers.map((answer) => (
            <Card key={answer.id} className="p-4 space-y-2">
              <p className="text-sm font-medium text-gray-500">Statement:</p>
              <p className="text-gray-800">{answer.statement?.content}</p>
              <div className="h-px bg-gray-200 my-3" />
              <p className="text-sm font-medium text-gray-500">Answer:</p>
              <p className="text-gray-800">{answer.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(answer.created_at).toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PresenterPage;
