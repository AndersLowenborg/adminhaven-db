
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PencilIcon, Play, Lock, ExternalLink, StopCircle } from "lucide-react";
import { Session } from "@/types/session";
import { useQueryClient, UseMutateFunction } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Participant } from "@/types/participant";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  onUpdateName: UseMutateFunction<Session, Error, string, unknown>;
  onStatusChange: () => void;
  participants: Participant[];
  statementsCount: number;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  name,
  status,
  sessionId,
  onUpdateName,
  onStatusChange,
  participants,
  statementsCount,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(name);

  const handlePublishToggle = async () => {
    try {
      const newStatus = status === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED';
      const { error } = await supabase
        .from('SESSION')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Session ${newStatus.toLowerCase()} successfully`,
      });
      
      onStatusChange();
    } catch (error) {
      console.error('Error toggling session publish state:', error);
      toast({
        title: "Error",
        description: `Failed to ${status === 'PUBLISHED' ? 'unpublish' : 'publish'} session`,
        variant: "destructive",
      });
    }
  };

  const handleSessionStateToggle = async () => {
    try {
      const newStatus = status === 'STARTED' ? 'ENDED' : 'STARTED';
      const { error } = await supabase
        .from('SESSION')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Session ${newStatus.toLowerCase()} successfully`,
      });
      
      onStatusChange();
    } catch (error) {
      console.error('Error toggling session state:', error);
      toast({
        title: "Error",
        description: `Failed to ${status === 'STARTED' ? 'end' : 'start'} session`,
        variant: "destructive",
      });
    }
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateName(newName);
    setIsEditingName(false);
  };

  const hasEnoughParticipants = participants.length >= 2;

  return (
    <div className="space-y-8 mb-12">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          asChild
          className="hover:bg-secondary"
        >
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
        <img 
          src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
          alt="Grousion Logo" 
          className="w-48 h-auto"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-2">
          {isEditingName ? (
            <form onSubmit={handleNameSubmit} className="flex gap-2 items-center">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="max-w-[300px]"
                placeholder="Enter session name"
                autoFocus
              />
              <Button type="submit" size="sm">Save</Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setIsEditingName(false);
                  setNewName(name);
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-semibold text-primary">
                {name || 'Unnamed Session'}
              </h2>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditingName(true)}
                className="hover:bg-secondary hover:text-primary"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handlePublishToggle}
            variant="ghost"
            size="icon"
            disabled={status === 'STARTED' || status === 'ENDED' || statementsCount === 0}
            title={statementsCount === 0 ? "Add at least one statement before publishing" : 
                   status === 'PUBLISHED' ? "Unpublish Session" : "Publish Session"}
            className="hover:bg-secondary"
          >
            {status === 'PUBLISHED' ? (
              <StopCircle className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            onClick={handleSessionStateToggle}
            variant="ghost"
            size="icon"
            disabled={
              (status !== 'PUBLISHED' && status !== 'STARTED') || 
              (status === 'PUBLISHED' && !hasEnoughParticipants)
            }
            title={
              status === 'PUBLISHED' && !hasEnoughParticipants 
                ? "Need at least 2 participants to start" 
                : status === 'STARTED' ? "End Session" : "Lock Session"
            }
            className="hover:bg-secondary"
          >
            <Lock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              window.open(`/presenter/${sessionId}`, '_blank');
            }}
            disabled={status === 'UNPUBLISHED'}
            title={status === 'UNPUBLISHED' ? "Session must be published first" : "Open Presenter View"}
            className="hover:bg-secondary"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
