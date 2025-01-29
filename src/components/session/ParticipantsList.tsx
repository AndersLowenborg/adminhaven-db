import React, { useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

type Participant = {
  id: number;
  name: string;
  created_at: string | null;
};

type ParticipantsListProps = {
  participants: Participant[];
  sessionId: string;
  queryKey: (string | number)[];  // Updated to accept both string and number in array
};

export const ParticipantsList = ({ participants, sessionId, queryKey }: ParticipantsListProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;

    console.log('Setting up real-time subscription for participants in session:', sessionId);
    const channel = supabase
      .channel(`participants-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'SessionUsers',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          console.log('Participants change detected:', payload);
          // Invalidate the query to refetch the updated data
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up participants subscription');
      supabase.removeChannel(channel);
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
            {participants.map((participant) => (
              <Badge 
                key={participant.id}
                variant="secondary"
                className="text-sm py-1 px-3"
              >
                {participant.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};