import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams, useNavigate } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { StatementResults } from '@/components/session/StatementResults';
import { useParticipants } from '@/hooks/use-participants';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { GroupPreparation } from '@/components/session/GroupPreparation';

const PresenterPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : null;
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { participants } = useParticipants(sessionId!);
  const [visibleResults, setVisibleResults] = useState<number[]>([]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `showingResultsFor-${sessionId}`) {
        const newVisibleResults = e.newValue ? JSON.parse(e.newValue) : [];
        setVisibleResults(newVisibleResults);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const storedValue = localStorage.getItem(`showingResultsFor-${sessionId}`);
    if (storedValue) {
      setVisibleResults(JSON.parse(storedValue));
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sessionId]);

  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['presenter-session', sessionId],
    queryFn: async () => {
      console.log('Fetching session data for presenter page, ID:', sessionId);
      
      const { count, error: countError } = await supabase
        .from('SESSION')
        .select('*', { count: 'exact', head: true })
        .eq('id', sessionId);
        
      if (countError) {
        console.error('Error checking session existence:', countError);
        throw countError;
      }
      
      if (count === 0) {
        console.error('No session found with ID:', sessionId);
        throw new Error('Session not found');
      }

      const { data, error } = await supabase
        .from('SESSION')
        .select('*')
        .eq('id', sessionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching session:', error);
        throw error;
      }
      
      if (!data) {
        console.error('Session data is null despite count > 0. Possible RLS issue.');
        throw new Error('Session not found');
      }
      
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: statements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('STATEMENT')
        .select('*')
        .eq('session_id', sessionId);

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: rounds } = useQuery({
    queryKey: ['rounds', sessionId],
    queryFn: async () => {
      console.log('Fetching rounds for session:', sessionId);
      
      const { data: statements, error: statementsError } = await supabase
        .from('STATEMENT')
        .select('id')
        .eq('session_id', sessionId);

      if (statementsError) throw statementsError;
      
      if (!statements || statements.length === 0) {
        console.log('No statements found for session');
        return [];
      }

      const statementIds = statements.map(s => s.id);
      console.log('Statement IDs:', statementIds);

      const { data, error } = await supabase
        .from('ROUND')
        .select('*')
        .in('statement_id', statementIds)
        .eq('status', 'STARTED');

      if (error) throw error;
      console.log('Fetched rounds:', data);
      return data;
    },
    enabled: !!sessionId,
  });

  const { data: answers } = useQuery({
    queryKey: ['presenter-answers', sessionId, session?.has_active_round],
    queryFn: async () => {
      if (!session?.has_active_round) {
        console.log('No active round found');
        return [];
      }

      console.log('Fetching answers for active round:', session.has_active_round);
      
      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('round_id', session.has_active_round);

      if (error) throw error;
      console.log('Fetched answers:', data);
      return data;
    },
    enabled: !!sessionId && !!session?.has_active_round,
  });

  useEffect(() => {
    if (!sessionId) return;

    const statementsChannel = supabase
      .channel(`presenter-statements-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'STATEMENT',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
        }
      )
      .subscribe();

    const roundsChannel = supabase
      .channel(`presenter-rounds-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ROUND'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['rounds', sessionId] });
        }
      )
      .subscribe();

    const answersChannel = supabase
      .channel(`presenter-answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ANSWER'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['presenter-answers', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statementsChannel);
      supabase.removeChannel(roundsChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [sessionId, queryClient]);

  const getAnswersForStatement = (statement: any) => {
    if (!answers) {
      console.log('No answers available');
      return [];
    }
    
    if (!session?.has_active_round) {
      console.log('No active round in session');
      return [];
    }

    const activeRound = rounds?.find(r => 
      r.statement_id === statement.id && 
      r.id === session.has_active_round &&
      r.status === 'STARTED'
    );

    if (!activeRound) {
      console.log(`No active round found for statement ${statement.id}`);
      return [];
    }

    console.log(`Filtering answers for statement ${statement.id}, round ${activeRound.id}`);
    return answers.filter(answer => answer.round_id === activeRound.id);
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <p className="text-[#8E9196]">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <Card className="p-6">
            <p className="text-red-600">Session not found. This session might have been deleted or you may not have permission to access it.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <img 
            src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
            alt="Grousion Logo" 
            className="w-48 h-auto"
          />
          <h1 className="text-3xl font-bold text-[#403E43]">Presenter Dashboard</h1>
        </div>
        
        {session && (
          <Card className="mb-8 p-6 shadow-sm">
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
          </Card>
        )}
        
        {statements && statements.length > 0 ? (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-semibold text-[#403E43] mb-4">Results</h2>
            {statements.map(statement => {
              const statementAnswers = getAnswersForStatement(statement);
              console.log(`Statement ${statement.id} has ${statementAnswers.length} answers`);
              return (
                <StatementResults
                  key={statement.id}
                  statement={statement}
                  answers={statementAnswers}
                  isVisible={visibleResults.includes(statement.id)}
                />
              );
            })}
          </div>
        ) : (
          <Card className="mb-8 p-6 shadow-sm text-center">
            <p className="text-[#8E9196]">No statements to show.</p>
          </Card>
        )}
        
        <Card className="p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-[#403E43]">Session Information</h2>
          <div className="flex items-start gap-8">
            <div className="flex-1">
              <p className="mb-2 text-[#8E9196]">Share this link with participants:</p>
              <input
                type="text"
                value={sessionUrl}
                readOnly
                className="w-full p-2 border rounded bg-gray-50 text-[#403E43]"
                onClick={(e) => e.currentTarget.select()}
              />
            </div>
            <div className="flex-shrink-0">
              <QRCodeSVG value={sessionUrl} size={200} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PresenterPage;
