
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Answer } from '@/types/answer';
import { Participant } from '@/types/participant';

interface GroupPreparationProps {
  participants: Participant[];
  answers: Answer[];
}

interface Group {
  id: number;
  members: Participant[];
  leader: Participant;
}

export const GroupPreparation = ({ participants, answers }: GroupPreparationProps) => {
  const [proposedGroups, setProposedGroups] = useState<Group[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const getMemberConfidenceLevel = (participant: Participant) => {
    const answer = answers.find(a => a.respondant_id === participant.id);
    return answer?.confidence_level || 0;
  };

  const getMemberAgreementLevel = (participant: Participant) => {
    const answer = answers.find(a => a.respondant_id === participant.id);
    return answer?.agreement_level || 0;
  };

  const formGroups = () => {
    if (participants.length < 2) {
      console.log('Not enough participants to form groups');
      return;
    }

    // Add confidence and agreement levels to participants for sorting
    const participantsWithLevels = participants.map(participant => ({
      ...participant,
      confidenceLevel: getMemberConfidenceLevel(participant),
      agreementLevel: getMemberAgreementLevel(participant)
    }));

    // Sort participants by confidence level
    const mediumConfidenceParticipants = participantsWithLevels.filter(p => p.confidenceLevel >= 4 && p.confidenceLevel <= 7);
    const highConfidenceParticipants = participantsWithLevels.filter(p => p.confidenceLevel > 7);
    const remainingParticipants = participantsWithLevels.filter(p => p.confidenceLevel < 4);

    // Calculate number of groups based on total participants
    const totalParticipants = participants.length;
    const numberOfGroups = Math.ceil(totalParticipants / 3);
    
    let groups: Group[] = Array.from({ length: numberOfGroups }, (_, i) => ({
      id: i + 1,
      members: [],
      leader: {} as Participant
    }));

    // First, distribute medium confidence participants
    mediumConfidenceParticipants.forEach((participant, index) => {
      const groupIndex = index % numberOfGroups;
      groups[groupIndex].members.push(participant);
    });

    // Then, pair high confidence participants with opposing views
    highConfidenceParticipants.sort((a, b) => a.agreementLevel - b.agreementLevel);
    for (let i = 0; i < highConfidenceParticipants.length; i += 2) {
      const groupIndex = i % numberOfGroups;
      groups[groupIndex].members.push(highConfidenceParticipants[i]);
      if (highConfidenceParticipants[i + 1]) {
        groups[groupIndex].members.push(highConfidenceParticipants[i + 1]);
      }
    }

    // Distribute remaining participants
    remainingParticipants.forEach((participant, index) => {
      const groupIndex = index % numberOfGroups;
      groups[groupIndex].members.push(participant);
    });

    // Assign random leaders
    groups = groups.map(group => ({
      ...group,
      leader: group.members[Math.floor(Math.random() * group.members.length)]
    }));

    setProposedGroups(groups.filter(group => group.members.length > 0));
    setShowPreview(true);
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={formGroups}
        disabled={participants.length < 2}
        className="w-full"
      >
        Prepare Groups for Next Round
      </Button>

      {showPreview && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Proposed Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proposedGroups.map((group) => (
                <Card key={group.id} className="p-4">
                  <h3 className="font-medium mb-2">Group {group.id}</h3>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Leader: {group.leader.name}</p>
                    <div className="pl-4">
                      <p className="text-sm font-medium">Members:</p>
                      <ul className="list-disc pl-4">
                        {group.members.map((member) => (
                          <li 
                            key={member.id} 
                            className={`text-sm ${member.id === group.leader.id ? 'font-medium' : ''}`}
                          >
                            {member.name}
                            {member.id === group.leader.id ? ' (Leader)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
