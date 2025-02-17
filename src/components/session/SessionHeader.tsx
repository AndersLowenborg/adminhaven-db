
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
      
      <div className="flex items-center gap-4 mb-6">
        <img 
          src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
          alt="Grousion Logo" 
          className="w-48 h-auto"
        />
        <h1 className="text-2xl font-bold text-[#403E43]">Session Management</h1>
      </div>

      <div className="flex items-center justify-between mb-8">
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
              <span className="text-sm text-gray-600">
                {name || 'Unnamed Session'}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditingName(true)}
                className="h-6 px-2"
              >
                Edit
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={handlePublishToggle}
            variant="default"
            disabled={status === 'STARTED' || status === 'ENDED'}
          >
            {status === 'PUBLISHED' ? 'Unpublish Session' : 'Publish Session'}
          </Button>
          <Button
            onClick={handleSessionStateToggle}
            variant="default"
            disabled={
              (status !== 'PUBLISHED' && status !== 'STARTED') || 
              (status === 'PUBLISHED' && !hasEnoughParticipants)
            }
            title={
              status === 'PUBLISHED' && !hasEnoughParticipants 
                ? "Need at least 2 participants to start" 
                : ""
            }
          >
            {status === 'STARTED' ? 'End Session' : 'Start Session'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              window.open(`/presenter/${sessionId}`, '_blank');
            }}
            disabled={status === 'UNPUBLISHED'}
            title={status === 'UNPUBLISHED' ? "Session must be published first" : ""}
          >
            Open Presenter View
          </Button>
        </div>
      </div>
    </div>
  );
};
