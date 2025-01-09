import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Participant = {
  id: number;
  name: string;
  created_at: string | null;
};

export const ParticipantsList = ({ participants }: { participants: Participant[] }) => {
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