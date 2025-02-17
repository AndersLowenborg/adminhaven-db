
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Answer } from '@/types/answer';
import { Participant } from '@/types/participant';
import { Badge } from "@/components/ui/badge";

interface GroupPreparationProps {
  participants: Participant[];
  answers: Answer[];
}

interface Group {
  id: number;
  members: Participant[];
  leader?: Participant;
}

export const GroupPreparation = ({ participants, answers }: GroupPreparationProps) => {
  const formGroups = (participants: Participant[], answers: Answer[]): Group[] => {
    // Map confidence and agreement levels to participants
    const participantData = participants.map(participant => {
      const answer = answers.find(a => a.respondant_id === participant.id);
      return {
        participant,
        confidenceLevel: answer?.confidence_level || 0,
        agreementLevel: answer?.agreement_level || 0
      };
    });

    // Calculate number of groups needed (2-3 participants per group)
    const totalParticipants = participants.length;
    const numGroups = Math.ceil(totalParticipants / 3);
    
    const groups: Group[] = [];
    
    // Create initial empty groups
    for (let i = 0; i < numGroups; i++) {
      groups.push({ id: i + 1, members: [] });
    }

    // Sort participants by confidence level
    const sortedParticipants = [...participantData].sort((a, b) => b.confidenceLevel - a.confidenceLevel);

    // Distribute participants evenly across groups
    sortedParticipants.forEach((data, index) => {
      const groupIndex = index % groups.length;
      groups[groupIndex].members.push(data.participant);
    });

    // Assign random leaders to groups that have members
    groups.forEach(group => {
      if (group.members.length > 0) {
        const leaderIndex = Math.floor(Math.random() * group.members.length);
        group.leader = group.members[leaderIndex];
      }
    });

    // Filter out empty groups
    return groups.filter(group => group.members.length > 0);
  };

  const groups = formGroups(participants, answers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {groups.length > 0 ? (
            groups.map((group, index) => (
              <Card key={group.id} className="p-4">
                <div className="font-medium mb-2">Group {index + 1}</div>
                <div className="space-y-2">
                  {group.members.map((member) => (
                    <div key={member.id} className="flex items-center gap-2">
                      <span>{member.name}</span>
                      {group.leader?.id === member.id && (
                        <Badge variant="secondary">Leader</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">No groups have been formed yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
