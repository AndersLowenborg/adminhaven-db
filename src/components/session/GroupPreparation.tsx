
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

    // Sort by confidence level
    const mediumConfidence = participantData.filter(p => p.confidenceLevel >= 3 && p.confidenceLevel <= 7);
    const highConfidence = participantData.filter(p => p.confidenceLevel > 7);
    
    // Calculate number of groups needed
    const totalParticipants = participants.length;
    const numGroups = Math.ceil(totalParticipants / 3);
    
    const groups: Group[] = [];
    
    // Create groups
    for (let i = 0; i < numGroups; i++) {
      groups.push({ id: i + 1, members: [] });
    }

    // First, pair high confidence users with opposing views
    const sortedHighConfidence = [...highConfidence].sort((a, b) => b.agreementLevel - a.agreementLevel);
    while (sortedHighConfidence.length >= 2) {
      const agree = sortedHighConfidence.shift();
      const disagree = sortedHighConfidence.pop();
      if (agree && disagree) {
        const groupIndex = groups.findIndex(g => g.members.length < 3);
        if (groupIndex !== -1) {
          groups[groupIndex].members.push(agree.participant, disagree.participant);
        }
      }
    }

    // Distribute medium confidence users
    let currentGroupIndex = 0;
    mediumConfidence.forEach(data => {
      while (groups[currentGroupIndex].members.length >= 3) {
        currentGroupIndex = (currentGroupIndex + 1) % groups.length;
      }
      groups[currentGroupIndex].members.push(data.participant);
      currentGroupIndex = (currentGroupIndex + 1) % groups.length;
    });

    // Add any remaining high confidence users
    sortedHighConfidence.forEach(data => {
      const targetGroup = groups.find(g => g.members.length < 3);
      if (targetGroup) {
        targetGroup.members.push(data.participant);
      }
    });

    // Assign random leaders
    groups.forEach(group => {
      if (group.members.length > 0) {
        const leaderIndex = Math.floor(Math.random() * group.members.length);
        group.leader = group.members[leaderIndex];
      }
    });

    return groups;
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
