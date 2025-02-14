
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Session } from "@/types/session";
import { useQueryClient, UseMutateFunction } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Participant } from "@/types/participant";

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  onUpdateName: UseMutateFunction<Session, Error, string, unknown>;
  onStatusChange: () => void;
  participants: Participant[];
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  name,
  status,
  sessionId,
  onUpdateName,
  onStatusChange,
  participants,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handlePublish = async () => {
    try {
      const { error } = await supabase
        .from('SESSION')
        .update({ status: 'PUBLISHED' })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Session published successfully",
      });
      
      onStatusChange();
    } catch (error) {
      console.error('Error publishing session:', error);
      toast({
        title: "Error",
        description: "Failed to publish session",
        variant: "destructive",
      });
    }
  };

  const handleUnpublish = async () => {
    try {
      const { error } = await supabase
        .from('SESSION')
        .update({ status: 'UNPUBLISHED' })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Session unpublished successfully",
      });
      
      onStatusChange();
    } catch (error) {
      console.error('Error unpublishing session:', error);
      toast({
        title: "Error",
        description: "Failed to unpublish session",
        variant: "destructive",
      });
    }
  };

  const handleStart = async () => {
    try {
      const { error } = await supabase
        .from('SESSION')
        .update({ status: 'STARTED' })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Session started successfully",
      });
      
      onStatusChange();
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: "Error",
        description: "Failed to start session",
        variant: "destructive",
      });
    }
  };

  const handleEnd = async () => {
    try {
      const { error } = await supabase
        .from('SESSION')
        .update({ status: 'ENDED' })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Session ended successfully",
      });
      
      onStatusChange();
    } catch (error) {
      console.error('Error ending session:', error);
      toast({
        title: "Error",
        description: "Failed to end session",
        variant: "destructive",
      });
    }
  };

  const hasEnoughParticipants = participants.length >= 2;

  return (
    <div>
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          className="mb-4"
        >
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
            alt="Grousion Logo" 
            className="w-48 h-auto"
          />
          <h1 className="text-2xl font-bold text-[#403E43]">Session Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handlePublish}
            variant="default"
            disabled={status !== 'UNPUBLISHED'}
          >
            Publish Session
          </Button>
          <Button
            onClick={handleUnpublish}
            variant="default"
            disabled={status !== 'PUBLISHED'}
          >
            Unpublish Session
          </Button>
          <Button
            onClick={handleStart}
            variant="default"
            disabled={status !== 'PUBLISHED' || !hasEnoughParticipants}
            title={!hasEnoughParticipants ? "Need at least 2 participants to start" : ""}
          >
            Start Session
          </Button>
          <Button
            onClick={handleEnd}
            variant="default"
            disabled={status !== 'STARTED'}
          >
            End Session
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/presenter/${sessionId}`, '_blank');
            }}
          >
            Open Presenter View
          </Button>
        </div>
      </div>
    </div>
  );
};
