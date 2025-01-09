import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PublishSessionProps {
  sessionId: number;
  status: string;
  hasStatements: boolean;
  onPublish: () => void;
}

export const PublishSession = ({ 
  sessionId, 
  status, 
  hasStatements,
  onPublish 
}: PublishSessionProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleTogglePublish = async () => {
    try {
      setIsLoading(true);
      console.log('Toggling session publish state:', sessionId);
      
      const newStatus = status === 'published' ? 'unpublished' : 'published';
      console.log('Setting new status to:', newStatus);

      const { error } = await supabase
        .from('Sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Session ${newStatus} successfully`,
      });
      
      onPublish();
    } catch (error) {
      console.error('Error updating session status:', error);
      toast({
        title: "Error",
        description: `Failed to ${status === 'published' ? 'unpublish' : 'publish'} session`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasStatements) {
    return null;
  }

  return (
    <Button 
      onClick={handleTogglePublish}
      disabled={isLoading}
      className="ml-4"
    >
      {isLoading 
        ? status === 'published' 
          ? "Unpublishing..." 
          : "Publishing..." 
        : status === 'published'
          ? "Unpublish Session"
          : "Publish Session"
      }
    </Button>
  );
};