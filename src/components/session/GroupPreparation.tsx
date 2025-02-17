
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Answer } from '@/types/answer';
import { Participant } from '@/types/participant';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GroupPreparationProps {
  participants: Participant[];
  answers: Answer[];
}

export const GroupPreparation = ({ participants, answers }: GroupPreparationProps) => {
  // Query to get rounds information
  const { data: rounds } = useQuery({
    queryKey: ['group-preparation-rounds'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ROUND')
        .select('*')
        .order('round_number', { ascending: true });

      if (error) throw error;
      console.log('Fetched rounds for group preparation:', data);
      return data;
    },
  });

  const canPrepareGroups = useMemo(() => {
    if (!rounds) return false;

    // Find all Round 1 entries
    const roundOnes = rounds.filter(round => round.round_number === 1);
    console.log('Round ones:', roundOnes);

    // Check if all Round 1 entries are completed
    const allRoundOnesCompleted = roundOnes.every(round => round.status === 'COMPLETED');
    console.log('All round ones completed:', allRoundOnesCompleted);

    // We need at least 2 participants to form groups
    const hasEnoughParticipants = participants.length >= 2;
    console.log('Has enough participants:', hasEnoughParticipants);

    return allRoundOnesCompleted && hasEnoughParticipants;
  }, [rounds, participants]);

  const handlePrepareGroups = () => {
    console.log('Preparing groups with participants:', participants);
    console.log('Available answers:', answers);
    // Group preparation logic will go here
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={handlePrepareGroups} 
            disabled={!canPrepareGroups}
            className="w-full"
          >
            Prepare Groups
          </Button>
          {!canPrepareGroups && (
            <p className="text-sm text-muted-foreground">
              {participants.length < 2 
                ? "At least 2 participants are needed to form groups"
                : "Waiting for all participants to complete Round 1"}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
