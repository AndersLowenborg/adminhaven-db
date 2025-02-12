
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SessionStatus } from '@/types/session';

interface PublishSessionProps {
  sessionId: number;
  status: SessionStatus;
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
      
      const newStatus = status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
      console.log('Setting new status to:', newStatus);

      const { error } = await supabase
        .from('SESSION')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Session ${newStatus.toLowerCase()} successfully`,
      });
      
      onPublish();
    } catch (error) {
      console.error('Error updating session status:', error);
      toast({
        title: "Error",
        description: `Failed to ${status === 'PUBLISHED' ? 'unpublish' : 'publish'} session`,
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
        ? status === 'PUBLISHED' 
          ? "Unpublishing..." 
          : "Publishing..." 
        : status === 'PUBLISHED'
          ? "Unpublish Session"
          : "Publish Session"
      }
    </Button>
  );
};
