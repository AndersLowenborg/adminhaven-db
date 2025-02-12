
import React, { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

type Participant = {
  id: number;
  name: string;
  created_at: string | null;
};

type ParticipantsListProps = {
  participants: Participant[];
  sessionId: string;
  queryKey: (string | number)[];
};

export const ParticipantsList = ({ participants, sessionId, queryKey }: ParticipantsListProps) => {
  const queryClient = useQueryClient();

  // Fetch answers for the current session to track who has answered
  const { data: participantAnswers } = useQuery({
    queryKey: ['participant-answers', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Answers')
        .select(`
          id,
          respondent_id,
          statement:Statements(
            id,
            status,
            session_id
          )
        `)
        .eq('statement.session_id', sessionId)
        .eq('statement.status', 'active')
        .eq('respondent_type', 'user');

      if (error) throw error;
      console.log('Fetched participant answers:', data);
      return data || [];
    },
    enabled: !!sessionId,
  });

  // Subscribe to changes in both SessionUsers and Answers tables
  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for participants in session:', sessionId);
    
    // Channel for participant updates
    const participantsChannel = supabase
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
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    // Channel for answer updates
    const answersChannel = supabase
      .channel(`answers-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Answers',
          filter: `statement.session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Answers change detected:', payload);
          queryClient.invalidateQueries({ queryKey: ['participant-answers', sessionId] });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up participants and answers subscriptions');
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [sessionId, queryKey, queryClient]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Participants ({participants.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <p className="text-muted-foreground">No participants have joined yet</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((participant) => {
              const hasAnswered = participantAnswers?.some(
                answer => answer.respondent_id === participant.id && answer.statement?.status === 'active'
              );

              return (
                <Badge 
                  key={participant.id}
                  variant={hasAnswered ? "default" : "secondary"}
                  className={`text-sm py-1 px-3 ${
                    hasAnswered ? "bg-green-500 hover:bg-green-600" : ""
                  }`}
                >
                  {participant.name}
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
