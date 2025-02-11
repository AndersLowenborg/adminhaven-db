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
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(name);

  const handleNameSubmit = () => {
    onUpdateName(editedName);
    setIsEditing(false);
  };

  const isSessionActive = status === 'published';
  const canStartSession = status === 'published' && participantCount > 1 && hasStatements;

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
          <span className="px-2 py-1 text-sm rounded bg-gray-100">
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </span>
          <span className="px-2 py-1 text-sm rounded bg-gray-100">
            Status: {status}
          </span>
          {canStartSession && (
            <Button 
              onClick={() => onStartRound(sessionId)}
              className="ml-2"
            >
              Start Session
            </Button>
          )}
          {!canStartSession && status === 'published' && (
            <span className="text-sm text-muted-foreground">
              (Need at least 2 participants and statements to start)
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant={allowJoins ? "default" : "outline"}
            onClick={() => onAllowJoinsChange(!allowJoins)}
          >
            {allowJoins ? 'Close Joins' : 'Allow Joins'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={testMode ? "default" : "outline"}
            onClick={() => onTestModeChange(!testMode)}
          >
            {testMode ? 'Disable Test Mode' : 'Enable Test Mode'}
          </Button>
          {testMode && (
            <Input
              type="number"
              min="1"
              max="100"
              value={testParticipantsCount}
              onChange={(e) => onTestParticipantsCountChange(parseInt(e.target.value, 10))}
              className="w-20"
            />
          )}
        </div>
      </div>
    </div>
  );
};
