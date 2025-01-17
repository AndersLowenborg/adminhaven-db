import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'react-router-dom';
import { ParticipantsList } from '@/components/session/ParticipantsList';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis } from 'recharts';

type Answer = {
  id: number;
  content: string;
  created_at: string;
  statement_id: number;
  user_id: number;
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
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const sessionUrl = sessionId ? `${window.location.origin}/user/${sessionId}` : '';

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

  const getAnswersForStatement = (statementId: number) => {
    return answers?.filter(answer => answer.statement_id === statementId) || [];
  };

  const prepareChartData = (statementAnswers: Answer[]) => {
    const agreementLevels = Array.from({ length: 5 }, (_, i) => i + 1);
    return agreementLevels.map(level => ({
      level: level.toString(),
      count: statementAnswers.filter(answer => answer.agreement_level === level).length
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
                  <ChartContainer
                    config={{
                      line1: { theme: { light: "#0ea5e9", dark: "#0ea5e9" } },
                    }}
                  >
                    <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Bar dataKey="count" fill="var(--color-line1)" />
                      <ChartTooltip>
                        <ChartTooltipContent />
                      </ChartTooltip>
                    </BarChart>
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