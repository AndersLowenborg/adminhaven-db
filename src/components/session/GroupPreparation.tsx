
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Answer } from '@/types/answer';
import { Participant } from '@/types/participant';
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [savedGroups, setSavedGroups] = React.useState<Group[]>([]);

  const createGroups = async (participants: Participant[], answers: Answer[]) => {
    try {
      // First, get the current session's active round
      const sessionId = answers[0]?.round_id ? 
        // Get session ID from the first answer's round
        (await supabase
          .from('ROUND')
          .select('statement_id')
          .eq('id', answers[0].round_id)
          .single())
          .data?.statement_id : null;

      if (!sessionId) {
        throw new Error('Could not determine session ID');
      }

      // Get the active round ID from the session
      const { data: sessionData, error: sessionError } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      
      const activeRoundId = sessionData.has_active_round;
      if (!activeRoundId) {
        throw new Error('No active round found in session');
      }

      console.log('Creating groups for active round:', activeRoundId);

      // Calculate number of groups needed (2-3 participants per group)
      const totalParticipants = participants.length;
      const numGroups = Math.ceil(totalParticipants / 3);
      
      const groups: Group[] = [];
      
      // Create initial empty groups
      for (let i = 0; i < numGroups; i++) {
        groups.push({ id: i + 1, members: [] });
      }

      // Distribute participants evenly across groups
      participants.forEach((participant, index) => {
        const groupIndex = index % groups.length;
        groups[groupIndex].members.push(participant);
      });

      // For each group, create database entries
      for (const group of groups) {
        if (group.members.length > 0) {
          // Randomly select a leader from the group members
          const leaderIndex = Math.floor(Math.random() * group.members.length);
          const leader = group.members[leaderIndex];
          
          // Create group in database
          const { data: groupData, error: groupError } = await supabase
            .from('GROUP')
            .insert([{ leader: leader.id }])
            .select()
            .single();

          if (groupError) throw groupError;

          // Add members to group
          const memberPromises = group.members.map(member => 
            supabase
              .from('GROUP_MEMBERS')
              .insert([{
                member_id: member.id,
                member_type: 'SESSION_USER',
                parent_group_id: groupData.id
              }])
          );

          await Promise.all(memberPromises);

          // Create round group association with the ACTIVE round
          const { error: roundGroupError } = await supabase
            .from('ROUND_GROUPS')
            .insert([{
              round_id: activeRoundId, // Using the active round ID instead of the previous round
              group_id: groupData.id
            }]);

          if (roundGroupError) throw roundGroupError;

          // Update the group object with the database id and leader
          group.id = groupData.id;
          group.leader = leader;
        }
      }

      // Filter out empty groups and update state
      const finalGroups = groups.filter(group => group.members.length > 0);
      setSavedGroups(finalGroups);

      toast({
        title: "Success",
        description: "Groups have been created and saved",
      });

    } catch (error) {
      console.error('Error creating groups:', error);
      toast({
        title: "Error",
        description: "Failed to create groups",
        variant: "destructive",
      });
    }
  };

  // Create groups when component mounts
  React.useEffect(() => {
    if (participants.length > 0 && answers.length > 0) {
      createGroups(participants, answers);
    }
  }, [participants, answers]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discussion Groups</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {savedGroups.length > 0 ? (
            savedGroups.map((group, index) => (
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

