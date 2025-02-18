
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useSessionContext } from "@supabase/auth-helpers-react";

export const GroupIdViewer = () => {
  const { session } = useSessionContext();

  const { data: groupIds, isLoading, error } = useQuery({
    queryKey: ['standalone-group-ids', session?.user?.id],
    queryFn: async () => {
      if (!session?.user) {
        console.log('No authenticated user found');
        throw new Error('Authentication required to view groups');
      }

      const { data, error } = await supabase
        .from('GROUPS')
        .select('id');
      
      if (error) {
        console.error('Supabase error fetching groups:', error);
        throw error;
      }

      console.log('Raw database response for GROUPS ids:', data);
      return data;
    },
    enabled: !!session?.user, // Only run query when user is authenticated
    staleTime: 0,
    gcTime: 0,
  });

  if (!session?.user) {
    return (
      <Card className="p-4">
        <div className="text-amber-600">Please log in to view group IDs</div>
      </Card>
    );
  }

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
          <div className="text-muted-foreground">No groups found</div>
        )}
      </div>
    </Card>
  );
};
