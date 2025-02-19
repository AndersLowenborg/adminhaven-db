
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

  // Get active round details to check if it's a group round
  const { data: activeRound } = useQuery({
    queryKey: ['active-round-type', sessionId, session?.has_active_round],
    queryFn: async () => {
      if (!session?.has_active_round) return null;
      
      const { data, error } = await supabase
        .from('ROUND')
        .select('id, respondant_type')
        .eq('id', session.has_active_round)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.has_active_round,
  });

  // Then fetch answers based on the round type
  const { data: participantAnswers } = useQuery({
    queryKey: ['participant-answers', sessionId, session?.has_active_round, activeRound?.respondant_type],
    queryFn: async () => {
      if (!session?.has_active_round) {
        console.log('No active round for participant answers');
        return [];
      }

      if (activeRound?.respondant_type === 'GROUP') {
        // For group rounds, first get the groups
        const { data: roundGroups, error: groupsError } = await supabase
          .from('ROUND_GROUPS')
          .select('groups_id')
          .eq('round_id', session.has_active_round);

        if (groupsError) throw groupsError;

        if (!roundGroups?.length) return [];

        // Then get the group members and their answers
        const groupIds = roundGroups.map(g => g.groups_id);
        
        // Get all group answers
        const { data: groupAnswers, error: answersError } = await supabase
          .from('ANSWER')
          .select('*')
          .eq('round_id', session.has_active_round)
          .eq('respondant_type', 'GROUP')
          .in('respondant_id', groupIds);

        if (answersError) throw answersError;

        // Get all group members
        const { data: groupMembers, error: membersError } = await supabase
          .from('GROUP_MEMBERS')
          .select('member_id, parent_groups_id')
          .in('parent_groups_id', groupIds);

        if (membersError) throw membersError;

        // Create a map of group IDs to whether they've answered
        const groupAnswersMap = new Map(
          groupAnswers?.map(answer => [answer.respondant_id, true]) || []
        );

        // Create a map of member IDs to their group's answer status
        return groupMembers?.reduce((acc, member) => {
          acc[member.member_id] = groupAnswersMap.has(member.parent_groups_id);
          return acc;
        }, {} as Record<number, boolean>) || {};

      } else {
        // For individual rounds, get individual answers
        const { data, error } = await supabase
          .from('ANSWER')
          .select('*')
          .eq('round_id', session.has_active_round);

        if (error) throw error;
        
        return data?.reduce((acc, answer) => {
          acc[answer.respondant_id] = true;
          return acc;
        }, {} as Record<number, boolean>) || {};
      }
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
              const hasAnswered = participantAnswers?.[participant.id] ?? false;

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
