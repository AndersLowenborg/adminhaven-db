import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PublishSession } from './PublishSession';
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, DoorClosed } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { Label } from "@/components/ui/label";

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  hasStatements: boolean;
  participantCount: number;
  testMode: boolean;
  testParticipantsCount: number;
  allowJoins: boolean;
  onUpdateName: (newName: string) => void;
  onStatusChange: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
  onTestModeChange: (enabled: boolean) => void;
  onTestParticipantsCountChange: (count: number) => void;
  onAllowJoinsChange: (allow: boolean) => void;
}

export const SessionHeader = ({ 
  name, 
  status, 
  sessionId,
  hasStatements,
  participantCount,
  testMode,
  testParticipantsCount,
  allowJoins,
  onUpdateName,
  onStatusChange,
  onStartSession,
  onEndSession,
  onTestModeChange,
  onTestParticipantsCountChange,
  onAllowJoinsChange,
}: SessionHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const isSessionActive = status === 'started' || status === 'closed';
  const showPresenterLink = status !== 'draft' && status !== 'unpublished';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Admin
          </Button>
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
          {status !== 'started' && status !== 'completed' && (
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
          {status === 'started' && (
            <Button 
              onClick={onEndSession}
              variant="destructive"
              className="ml-2"
            >
              End Session
            </Button>
          )}
          {status === 'completed' && (
            <Button 
              onClick={onStartSession}
              variant="default"
              className="ml-2"
            >
              Reopen Session
            </Button>
          )}
        </div>
      </div>
      
      {/* Presenter link section - only shown when session is published or beyond */}
      {showPresenterLink && (
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

      {/* Session controls */}
      <div className="flex flex-wrap items-center gap-4 mt-4 p-4 border rounded-lg bg-muted">
        {/* Allow joins toggle */}
        <div className="flex items-center gap-2">
          <Switch
            id="allow-joins"
            checked={allowJoins}
            onCheckedChange={onAllowJoinsChange}
            disabled={!isSessionActive}
          />
          <Label htmlFor="allow-joins" className="flex items-center gap-2">
            <DoorClosed className="h-4 w-4" />
            Allow Joins
          </Label>
        </div>

        {/* Test mode controls */}
        {status === 'draft' && (
          <>
            <div className="flex items-center gap-2">
              <Switch
                id="test-mode"
                checked={testMode}
                onCheckedChange={onTestModeChange}
              />
              <Label htmlFor="test-mode">Test Mode</Label>
            </div>
            
            {testMode && (
              <div className="flex items-center gap-2">
                <Label htmlFor="test-participants">Test Participants:</Label>
                <Input
                  id="test-participants"
                  type="number"
                  min="1"
                  max="50"
                  value={testParticipantsCount}
                  onChange={(e) => onTestParticipantsCountChange(parseInt(e.target.value) || 0)}
                  className="w-24"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};