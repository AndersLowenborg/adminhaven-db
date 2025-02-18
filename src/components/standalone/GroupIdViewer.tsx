
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { useParams } from "react-router-dom";

export const GroupIdViewer = () => {
  const { session } = useSessionContext();
  const { id: sessionId } = useParams();

  const { data: groupIds, isLoading, error } = useQuery({
    queryKey: ['standalone-group-ids', sessionId],
    queryFn: async () => {
      if (!sessionId) {
        console.log('No session ID available');
        return [];
      }

      // First get the active round for this session
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

      // Then get the groups associated with this round
      const { data: roundGroups, error: roundGroupsError } = await supabase
        .from('ROUND_GROUPS')
        .select('groups_id')
        .eq('round_id', sessionData.has_active_round);

      if (roundGroupsError) {
        console.error('Error fetching round groups:', roundGroupsError);
        throw roundGroupsError;
      }

      // Get the actual groups
      const groupIds = roundGroups?.map(rg => rg.groups_id) || [];
      
      if (groupIds.length === 0) {
        console.log('No groups found for round');
        return [];
      }

      const { data: groups, error: groupsError } = await supabase
        .from('GROUPS')
        .select('id')
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
              Group ID: {group.id}
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">No groups found for this session</div>
        )}
      </div>
    </Card>
  );
};
