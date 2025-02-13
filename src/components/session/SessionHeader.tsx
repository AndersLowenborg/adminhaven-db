
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Session } from '@/types/session';
import { PublishSession } from './PublishSession';
import { Link } from 'react-router-dom';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  hasStatements: boolean;
  participantCount: number;
  onUpdateName: (name: string) => void;
  onStatusChange: () => void;
  onStartRound: () => void;
  onEndRound: () => void;
}

export const SessionHeader = ({
  name,
  status,
  sessionId,
  hasStatements,
  participantCount,
  onUpdateName,
  onStatusChange,
  onStartRound,
  onEndRound,
}: SessionHeaderProps) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(name);
  const { toast } = useToast();
  const presenterUrl = `${window.location.origin}/presenter/${sessionId}`;

  const handleNameSubmit = () => {
    onUpdateName(editedName);
    setIsEditing(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(presenterUrl);
      toast({
        title: "Success",
        description: "Presenter link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const isSessionActive = status === 'PUBLISHED';
  const canStartSession = status === 'PUBLISHED' && participantCount > 1 && hasStatements;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isEditing ? (
            <div className="flex gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="w-[200px]"
              />
              <Button onClick={handleNameSubmit}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {status === 'PUBLISHED' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-md">
              <span className="text-sm text-muted-foreground">Presenter URL:</span>
              <Link 
                to={`/presenter/${sessionId}`}
                className="text-sm hover:underline flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                {presenterUrl}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className="ml-2"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          <span className="px-2 py-1 text-sm rounded bg-gray-100">
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </span>
          <span className="px-2 py-1 text-sm rounded bg-gray-100">
            Status: {status}
          </span>
          <PublishSession
            sessionId={sessionId}
            status={status as any}
            hasStatements={hasStatements}
            onPublish={onStatusChange}
          />
          {canStartSession && (
            <Button 
              onClick={onStartRound}
              className="ml-2"
            >
              Start Session
            </Button>
          )}
          {!canStartSession && status === 'PUBLISHED' && (
            <span className="text-sm text-muted-foreground">
              (Need at least 2 participants and statements to start)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
