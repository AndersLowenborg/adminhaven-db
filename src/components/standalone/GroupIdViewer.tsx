
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

export const GroupIdViewer = () => {
  const { data: groupIds, isLoading, error } = useQuery({
    queryKey: ['standalone-group-ids'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('GROUP')
        .select('id');
      
      if (error) throw error;
      console.log('Raw database response for GROUP ids:', data);
      return data;
    }
  });

  if (isLoading) return <div>Loading group IDs...</div>;
  if (error) return <div>Error loading group IDs</div>;

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-2">Group IDs (Standalone Component)</h3>
      <div className="space-y-1">
        {groupIds?.map(group => (
          <div key={group.id} className="text-sm">
            Group ID: {group.id}
          </div>
        ))}
      </div>
    </Card>
  );
};
