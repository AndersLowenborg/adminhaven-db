import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Cell, ResponsiveContainer } from 'recharts';

// Define a color palette for the bubbles
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
};

const PresenterPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString, 10) : null;
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';
  const queryClient = useQueryClient();

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
      return data as Answer[];
    },
    enabled: !!sessionId,
  });

  // Fetch session users
  const { data: sessionUsers } = useQuery({
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

  // Set up real-time subscription for participants
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for participants...');
    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SessionUsers',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Participants change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['session-users', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up participants subscription');
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);

  const getAnswersForStatement = (statementId: number) => {
    return answers?.filter(answer => answer.statement_id === statementId) || [];
  };

  const prepareChartData = (statementAnswers: Answer[]) => {
    return statementAnswers.map((answer, index) => ({
      x: answer.agreement_level,
      y: index + 1,
      z: answer.confidence_level,
      agreement: answer.agreement_level,
      confidence: answer.confidence_level,
      colorIndex: index % COLORS.length
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

  const lockedStatements = statements?.filter(statement => statement.status === 'locked') || [];

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Presenter Dashboard</h1>
      
      {lockedStatements.length > 0 && (
        <div className="space-y-6 mb-8">
          <h2 className="text-2xl font-semibold">Results</h2>
          {lockedStatements.map(statement => {
            const statementAnswers = getAnswersForStatement(statement.id);
            const chartData = prepareChartData(statementAnswers);
            
            return (
              <Card key={statement.id} className="p-6">
                <h3 className="text-xl font-medium mb-4">{statement.content}</h3>
                <div className="h-64">
                  <ChartContainer>
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis 
                        type="number" 
                        dataKey="x" 
                        name="Agreement" 
                        domain={[0, 6]}
                        tickCount={6}
                        label={{ value: 'Agreement Level', position: 'bottom' }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="y" 
                        name="Position"
                        domain={[0, 'auto']}
                        hide
                      />
                      <ZAxis 
                        type="number" 
                        dataKey="z" 
                        range={[400, 1000]} 
                        name="Confidence"
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
                  </ChartContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  Total responses: {statementAnswers.length}
                </div>
              </Card>
            );
          })}
        </div>
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
        <ParticipantsList 
          participants={sessionUsers} 
          sessionId={sessionId}
          queryKey={['session-users', sessionId]}
        />
      )}
    </div>
  );
};

export default PresenterPage;