
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Answer } from '@/types/answer';
import { Participant } from '@/types/participant';
import { Button } from "@/components/ui/button";
import { UsersRoundIcon } from 'lucide-react';

interface GroupPreparationProps {
  participants: Participant[];
  answers: Answer[];
  currentRoundNumber?: number;
}

export const GroupPreparation = ({ participants, answers, currentRoundNumber = 1 }: GroupPreparationProps) => {
  const shouldEnableGrouping = currentRoundNumber > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            disabled={!shouldEnableGrouping} 
            className="w-full"
            variant="outline"
          >
            <UsersRoundIcon className="mr-2 h-4 w-4" />
            Form Groups
          </Button>
          <p className="text-muted-foreground text-sm">
            {!shouldEnableGrouping 
              ? "Complete round 1 to enable group formation"
              : "Click to automatically form discussion groups"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
