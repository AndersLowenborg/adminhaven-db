
import React, { useEffect, useState } from 'react';
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
  const [savedGroups, setSavedGroups] = useState<Group[]>([]);

  const createInitialGroups = async (sessionId: number, roundId: number, participants: Participant[], answers: Answer[]) => {
    const groups: Group[] = [];
    // Calculate number of groups needed (2-3 participants per group)
    const numGroups = Math.ceil(participants.length / 3);
    
    // Create initial empty groups
    for (let i = 0; i < numGroups; i++) {
      groups.push({ id: i + 1, members: [] });
    }

    // Distribute participants evenly across groups
    participants.forEach((participant, index) => {
      const groupIndex = index % groups.length;
      groups[groupIndex].members.push(participant);
    });

    // Save groups to database
    for (const group of groups) {
      if (group.members.length > 0) {
        const leaderIndex = Math.floor(Math.random() * group.members.length);
        const leader = group.members[leaderIndex];
        
        const { data: groupData, error: groupError } = await supabase
          .from('GROUPS')
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
              parent_groups_id: groupData.id
            }])
        );

        await Promise.all(memberPromises);

        // Create round group association
        await supabase
          .from('ROUND_GROUPS')
          .insert([{
            round_id: roundId,
            groups_id: groupData.id
          }]);
      }
    }

    return groups;
  };

  const mergeGroups = async (sessionId: number, currentRoundId: number, previousRoundId: number) => {
    console.log('Merging groups from previous round:', previousRoundId);
    
    // Get previous round's groups
    const { data: previousGroups, error: previousGroupsError } = await supabase
      .from('ROUND_GROUPS')
      .select(`
        groups_id,
        groups:GROUPS (
          id,
          leader,
          members:GROUP_MEMBERS (
            member_id,
            member_type
          )
        )
      `)
      .eq('round_id', previousRoundId);

    if (previousGroupsError) throw previousGroupsError;
    
    if (!previousGroups?.length) {
      throw new Error('No groups found from previous round');
    }

    // Calculate how many new groups we need (combine every 2-3 previous groups)
    const numNewGroups = Math.ceil(previousGroups.length / 3);
    const newGroups: any[] = [];

    // Create new merged groups
    for (let i = 0; i < previousGroups.length; i += 3) {
      const groupsToMerge = previousGroups.slice(i, Math.min(i + 3, previousGroups.length));
      
      // Create new group
      const { data: newGroup, error: newGroupError } = await supabase
        .from('GROUPS')
        .insert([{
          // Randomly select a leader from one of the merged groups
          leader: groupsToMerge[Math.floor(Math.random() * groupsToMerge.length)].groups.leader
        }])
        .select()
        .single();

      if (newGroupError) throw newGroupError;

      // Get all members from previous groups
      const allMembers = groupsToMerge.flatMap(g => g.groups.members);
      
      // Add all members to new group
      const memberPromises = allMembers.map(member => 
        supabase
          .from('GROUP_MEMBERS')
          .insert([{
            member_id: member.member_id,
            member_type: member.member_type,
            parent_groups_id: newGroup.id
          }])
      );

      await Promise.all(memberPromises);

      // Create round group association
      await supabase
        .from('ROUND_GROUPS')
        .insert([{
          round_id: currentRoundId,
          groups_id: newGroup.id
        }]);

      newGroups.push(newGroup);
    }

    return newGroups;
  };

  const createGroups = async (participants: Participant[], answers: Answer[]) => {
    try {
      // Get session ID from the first participant
      const sessionId = participants[0]?.session_id;
      if (!sessionId) {
        throw new Error('Could not determine session ID from participants');
      }

      // Get the active round ID and info
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

      // Get current round info
      const { data: currentRound, error: currentRoundError } = await supabase
        .from('ROUND')
        .select('round_number, statement_id')
        .eq('id', activeRoundId)
        .single();

      if (currentRoundError) throw currentRoundError;

      let groups;
      
      if (currentRound.round_number === 2) {
        // For round 2, create initial groups from individual participants
        groups = await createInitialGroups(sessionId, activeRoundId, participants, answers);
      } else {
        // For rounds 3 and 4, merge groups from previous round
        // Get the previous round
        const { data: previousRound, error: previousRoundError } = await supabase
          .from('ROUND')
          .select('id')
          .eq('statement_id', currentRound.statement_id)
          .eq('round_number', currentRound.round_number - 1)
          .single();

        if (previousRoundError) throw previousRoundError;

        groups = await mergeGroups(sessionId, activeRoundId, previousRound.id);
      }

      setSavedGroups(groups);
      
      toast({
        title: "Success",
        description: `Groups have been created for round ${currentRound.round_number}`,
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
  useEffect(() => {
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

