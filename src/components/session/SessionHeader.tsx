import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublishSession } from './PublishSession';
import { useToast } from "@/hooks/use-toast";

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  hasStatements: boolean;
  participantCount: number;
  onUpdateName: (newName: string) => void;
  onStatusChange: () => void;
  onStartSession: () => void;
}

export const SessionHeader = ({ 
  name, 
  status, 
  sessionId,
  hasStatements,
  participantCount,
  onUpdateName,
  onStatusChange,
  onStartSession
}: SessionHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onUpdateName(editedName.trim());
      setIsEditing(false);
    }
  };

  const presenterLink = `${window.location.origin}/presenter/${sessionId}`;

  const copyPresenterLink = () => {
    navigator.clipboard.writeText(presenterLink);
    toast({
      title: "Link copied",
      description: "Presenter link copied to clipboard",
    });
  };

  const canStartSession = status === 'published' && participantCount > 1 && hasStatements;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-3xl font-bold"
              />
              <Button type="submit">Save</Button>
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">{name}</h1>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p className="text-muted-foreground">
            Status: <span className="font-medium capitalize">{status}</span>
          </p>
          {status === 'published' && !canStartSession && (
            <p className="text-sm text-muted-foreground">
              (Need at least 2 participants to start)
            </p>
          )}
          {status !== 'started' && (
            <PublishSession
              sessionId={sessionId}
              status={status}
              hasStatements={hasStatements}
              onPublish={onStatusChange}
            />
          )}
          {canStartSession && (
            <Button 
              onClick={onStartSession}
              variant="default"
              className="ml-2"
            >
              Start Session
            </Button>
          )}
        </div>
      </div>
      
      {status === 'published' && (
        <div className="flex items-center gap-2 mt-2">
          <Input 
            value={presenterLink}
            readOnly
            className="bg-muted"
          />
          <Button onClick={copyPresenterLink} variant="secondary">
            Copy Link
          </Button>
        </div>
      )}
    </div>
  );
};