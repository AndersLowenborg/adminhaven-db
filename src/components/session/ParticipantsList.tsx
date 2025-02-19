
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
  sessionId: number;
  queryKey: (string | number)[];
};

export const ParticipantsList = ({ participants, sessionId, queryKey }: ParticipantsListProps) => {
  const queryClient = useQueryClient();

  // First get the active round ID from the session
  const { data: session } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Then fetch answers for the active round
  const { data: participantAnswers } = useQuery({
    queryKey: ['participant-answers', sessionId, session?.has_active_round],
    queryFn: async () => {
      if (!session?.has_active_round) {
        console.log('No active round for participant answers');
        return [];
      }

      const { data, error } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('round_id', session.has_active_round);

      if (error) throw error;
      console.log('Fetched participant answers:', data);
      return data || [];
    },
    enabled: !!sessionId && !!session?.has_active_round,
  });

  // Subscribe to changes in both SESSION_USERS and ANSWER tables
  useEffect(() => {
    if (!sessionId || !session?.has_active_round) return;

    console.log('Setting up real-time subscription for participants in session:', sessionId);
    
    const participantsChannel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'SESSION_USERS',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Participants change detected:', payload);
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    const answersChannel = supabase
      .channel(`answers-${session.has_active_round}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ANSWER',
          filter: `round_id=eq.${session.has_active_round}`
        },
        (payload) => {
          console.log('Answers change detected:', payload);
          queryClient.invalidateQueries({ 
            queryKey: ['participant-answers', sessionId, session.has_active_round]
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up participants and answers subscriptions');
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(answersChannel);
    };
  }, [sessionId, session?.has_active_round, queryKey, queryClient]);

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
                answer => answer.respondant_id === participant.id
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
