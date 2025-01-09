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
  const [isPublishing, setIsPublishing] = React.useState(false);

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      console.log('Publishing session:', sessionId);
      
      const { error } = await supabase
        .from('Sessions')
        .update({ status: 'active' })
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session published successfully",
      });
      
      onPublish();
    } catch (error) {
      console.error('Error publishing session:', error);
      toast({
        title: "Error",
        description: "Failed to publish session",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (status === 'completed' || !hasStatements) {
    return null;
  }

  return (
    <Button 
      onClick={handlePublish}
      disabled={isPublishing}
      className="ml-4"
    >
      {isPublishing ? "Publishing..." : "Publish Session"}
    </Button>
  );
};