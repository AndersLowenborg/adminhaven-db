
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useParams } from "react-router-dom";

export const GroupIdViewer = () => {
  const { session } = useSessionContext();
  const { id: sessionIdParam } = useParams();
  const sessionId = sessionIdParam ? parseInt(sessionIdParam, 10) : null;

  const { data: groupIds, isLoading, error } = useQuery({
    queryKey: ['standalone-group-ids', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        console.log('No session ID available');
        return [];
      }

      // Get the active round ID from the session
      const { data: sessionData, error: sessionError } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        throw sessionError;
      }

      if (!sessionData?.has_active_round) {
        console.log('No active round found for session');
        return [];
      }

      console.log('Active round ID:', sessionData.has_active_round);

      // Get the groups for this round via ROUND_GROUPS
      const { data: roundGroups, error: roundGroupsError } = await supabase
        .from('ROUND_GROUPS')
        .select('groups_id')
        .eq('round_id', sessionData.has_active_round);

      if (roundGroupsError) {
        console.error('Error fetching round groups:', roundGroupsError);
        throw roundGroupsError;
      }

      const groupIds = roundGroups?.map(rg => rg.groups_id).filter(Boolean) || [];
      
      if (groupIds.length === 0) {
        console.log('No groups found for active round');
        return [];
      }

      console.log('Group IDs found:', groupIds);

      // Get the actual groups
      const { data: groups, error: groupsError } = await supabase
        .from('GROUPS')
        .select('*')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        throw groupsError;
      }

      console.log('Raw database response for GROUPS ids:', groups);
      return groups;
    },
    enabled: !!sessionId,
    staleTime: 0,
    gcTime: 0,
  });

  if (isLoading) return (
    <Card className="p-4">
      <div>Loading group IDs...</div>
    </Card>
  );

  if (error) return (
    <Card className="p-4">
      <div className="text-red-600">
        Error loading group IDs: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    </Card>
  );

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Group IDs (Standalone Component)</h3>
      <div className="space-y-1">
        {groupIds && groupIds.length > 0 ? (
          groupIds.map(group => (
            <div key={group.id} className="text-sm">
              Group ID: {group.id} {group.leader && `(Leader: ${group.leader})`}
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">No groups found for the active round</div>
        )}
      </div>
    </Card>
  );
};
