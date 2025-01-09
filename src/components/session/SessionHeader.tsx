import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SessionHeaderProps {
  name: string;
  status: string;
  onUpdateName: (newName: string) => void;
}

export const SessionHeader = ({ name, status, onUpdateName }: SessionHeaderProps) => {
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
      <p className="text-muted-foreground">
        Status: <span className="font-medium">{status}</span>
      </p>
    </div>
  );
};