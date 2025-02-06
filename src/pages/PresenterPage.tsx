import { useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Cell, ResponsiveContainer } from 'recharts';
import { useParticipants } from '@/hooks/use-participants';
import { StatementTimer } from '@/components/session/StatementTimer';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
  '#F1C40F', '#E74C3C', '#1ABC9C', '#34495E', '#95A5A6'
];

type Answer = {
  id: number;
  content: string;
  created_at: string;
  statement_id: number;
  agreement_level: number;
  confidence_level: number;
  statement: {
    content: string;
  };
};

type Statement = {
  id: number;
  content: string;
  created_at: string;
  status: string;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: string;
  show_results?: boolean;
};

const PresenterPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : null;
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';
  const queryClient = useQueryClient();
  const { participants } = useParticipants(sessionId!);

  // Fetch session data
  const { data: session, isLoading: isSessionLoading } = useQuery({
    queryKey: ['presenter-session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
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
      console.log('Fetched statements:', data);
      return data as Statement[];
    },
    enabled: !!sessionId,
  });

  // Fetch answers for locked statements
  const { data: answers } = useQuery({
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
      console.log('Fetched answers:', data);
      return data as Answer[];
    },
    enabled: !!sessionId,
  });

  // Set up real-time subscriptions
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscriptions for presenter view:', sessionId);
    
    // Channel for session updates
    const sessionChannel = supabase
      .channel(`presenter-session-${sessionId}`)
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
          queryClient.invalidateQueries({ queryKey: ['presenter-session', sessionId] });
        }
      )
      .subscribe();

    // Channel for statements updates
    const statementsChannel = supabase
      .channel(`presenter-statements-${sessionId}`)
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
          // Invalidate both statements and answers queries when a statement changes
          queryClient.invalidateQueries({ queryKey: ['statements', sessionId] });
          queryClient.invalidateQueries({ queryKey: ['presenter-answers', sessionId] });
        }
      )
      .subscribe();

    // Channel for answers updates
    const answersChannel = supabase
      .channel(`presenter-answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Answers',
        },
        (payload) => {
          console.log('Answers update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['presenter-answers', sessionId] });
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

  const getAnswersForStatement = (statementId: number) => {
    return answers?.filter(answer => answer.statement_id === statementId) || [];
  };

  const prepareChartData = (statementAnswers: Answer[]) => {
    return statementAnswers.map((answer, index) => ({
      x: answer.agreement_level,
      y: answer.confidence_level,
      agreement: answer.agreement_level,
      confidence: answer.confidence_level,
      colorIndex: index % COLORS.length
    }));
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <p className="text-[#8E9196]">Loading session...</p>
      </div>
    );
  }

  if (!session || !sessionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <p className="text-red-600">Session not found</p>
      </div>
    );
  }

  const statementsToShow = statements?.filter(statement => statement.show_results) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-8">
        <div className="flex items-center gap-4 mb-8">
          <img 
            src="/lovable-uploads/7f867208-6c5c-4b53-aad8-f74c1fab9c89.png" 
            alt="Grousion Logo" 
            className="h-12 w-auto"
          />
          <h1 className="text-3xl font-bold text-[#403E43]">Presenter Dashboard</h1>
        </div>
        
        {session && (
          <Card className="mb-8 p-6 shadow-sm">
            <ParticipantsList 
              participants={participants || []} 
              sessionId={sessionId.toString()}
              queryKey={['participants', sessionId]}
            />
          </Card>
        )}

        {statements?.filter(s => s.status === 'active').map(statement => (
          <Card key={statement.id} className="mb-8 p-6 shadow-sm">
            <StatementTimer
              timerSeconds={statement.timer_seconds}
              timerStartedAt={statement.timer_started_at}
              timerStatus={statement.timer_status}
            />
          </Card>
        ))}
        
        {statementsToShow.length > 0 ? (
          <div className="space-y-6 mb-8">
            <h2 className="text-2xl font-semibold text-[#403E43] mb-4">Results</h2>
            {statementsToShow.map(statement => {
              const statementAnswers = getAnswersForStatement(statement.id);
              const chartData = prepareChartData(statementAnswers);
              
              return (
                <Card key={statement.id} className="p-6 shadow-sm">
                  <h3 className="text-xl font-medium mb-4 text-[#403E43]">{statement.content}</h3>
                  {chartData.length > 0 ? (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                          <XAxis 
                            type="number" 
                            dataKey="x" 
                            name="Agreement" 
                            domain={[0, 10]}
                            tickCount={11}
                            label={{ value: 'Agreement Level', position: 'bottom', style: { fill: '#8E9196' } }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="y" 
                            name="Confidence"
                            domain={[0, 10]}
                            tickCount={11}
                            label={{ value: 'Confidence Level', angle: -90, position: 'insideLeft', style: { fill: '#8E9196' } }}
                          />
                          <Scatter data={chartData}>
                            {chartData.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={COLORS[entry.colorIndex]}
                              />
                            ))}
                          </Scatter>
                          <ChartTooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-2 border rounded shadow">
                                    <p>Agreement: {data.agreement}</p>
                                    <p>Confidence: {data.confidence}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-64 w-full flex items-center justify-center text-[#8E9196]">
                      No answers yet
                    </div>
                  )}
                  <div className="mt-4 text-sm text-[#8E9196]">
                    Total responses: {statementAnswers.length}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="mb-8 p-6 shadow-sm text-center">
            <p className="text-[#8E9196]">No statements with results to show.</p>
            <p className="text-sm text-[#8E9196] mt-2">Click "Show Results" on a statement to see participant responses here.</p>
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
