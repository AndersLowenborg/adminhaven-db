
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PublishSession } from './PublishSession';
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, DoorClosed, Users } from "lucide-react";
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
  currentRound: number;
  onUpdateName: (newName: string) => void;
  onStatusChange: () => void;
  onStartRound: () => void;
  onEndRound: () => void;
  onGenerateGroups: () => void;
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
  currentRound,
  onUpdateName,
  onStatusChange,
  onStartRound,
  onEndRound,
  onGenerateGroups,
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
  const isRoundActive = status === 'round_in_progress';
  const isRoundEnded = status === 'round_ended';
  const showPresenterLink = status !== 'draft' && status !== 'unpublished';

  const getButtonText = () => {
    if (isRoundActive) {
      return `End Round ${currentRound}`;
    } else if (isRoundEnded) {
      if (currentRound < Math.ceil(Math.log2(participantCount / 3))) {
        return 'Generate Groups';
      }
      return 'Complete Session';
    }
    return 'Start Session';
  };

  const handleMainAction = () => {
    if (isRoundActive) {
      onEndRound();
    } else if (isRoundEnded) {
      if (currentRound < Math.ceil(Math.log2(participantCount / 3))) {
        onGenerateGroups();
      } else {
        onEndRound(); // This will complete the session
      }
    } else if (canStartSession) {
      // Close session to new joins when starting
      onAllowJoinsChange(false);
      // Now the admin can start rounds for individual statements
    }
  };

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
          {status !== 'round_in_progress' && status !== 'completed' && (
            <PublishSession
              sessionId={sessionId}
              status={status}
              hasStatements={hasStatements}
              onPublish={onStatusChange}
            />
          )}
          {(canStartSession || isRoundActive || isRoundEnded) && (
            <Button 
              onClick={handleMainAction}
              variant={isRoundActive ? "destructive" : "default"}
              className="ml-2"
            >
              {getButtonText()}
            </Button>
          )}
        </div>
      </div>
      
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

      <div className="flex flex-wrap items-center gap-4 mt-4 p-4 border rounded-lg bg-muted">
        <div className="flex items-center gap-2">
          <Switch
            id="allow-joins"
            checked={allowJoins}
            onCheckedChange={onAllowJoinsChange}
            disabled={isRoundActive}
          />
          <Label htmlFor="allow-joins" className="flex items-center gap-2">
            <DoorClosed className="h-4 w-4" />
            Allow Joins
          </Label>
        </div>

        {(status === 'draft' || status === 'unpublished') && (
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

        {currentRound > 0 && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Round {currentRound}</span>
          </div>
        )}
      </div>
    </div>
  );
};
