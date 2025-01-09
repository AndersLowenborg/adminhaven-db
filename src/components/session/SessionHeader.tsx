import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublishSession } from './PublishSession';

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  hasStatements: boolean;
  onUpdateName: (newName: string) => void;
  onStatusChange: () => void;
}

export const SessionHeader = ({ 
  name, 
  status, 
  sessionId,
  hasStatements,
  onUpdateName,
  onStatusChange
}: SessionHeaderProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onUpdateName(editedName.trim());
      setIsEditing(false);
    }
  };

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
            Status: <span className="font-medium">{status}</span>
          </p>
          <PublishSession
            sessionId={sessionId}
            status={status}
            hasStatements={hasStatements}
            onPublish={onStatusChange}
          />
        </div>
      </div>
    </div>
  );
};