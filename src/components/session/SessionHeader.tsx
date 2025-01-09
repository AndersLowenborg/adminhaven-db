import React from 'react';

interface SessionHeaderProps {
  name: string;
  status: string;
}

export const SessionHeader = ({ name, status }: SessionHeaderProps) => {
  return (
    <div>
      <h1 className="text-3xl font-bold">{name}</h1>
      <p className="text-muted-foreground mt-2">
        Status: <span className="font-medium">{status}</span>
      </p>
    </div>
  );
};