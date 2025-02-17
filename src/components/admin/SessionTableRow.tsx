
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminSession } from '@/types/admin-session';

interface SessionTableRowProps {
  session: AdminSession;
  onNavigate: (id: number) => void;
  onDelete: (id: number) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'UNPUBLISHED':
      return 'secondary';
    case 'PUBLISHED':
    case 'STARTED':
      return 'default';
    case 'ENDED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusTooltip = (status: string) => {
  switch (status) {
    case 'UNPUBLISHED':
      return "Session is not yet available to participants";
    case 'PUBLISHED':
      return "Session is open for participants to join";
    case 'STARTED':
      return "Session is locked and in progress";
    case 'ENDED':
      return "Session has been completed";
    default:
      return "";
  }
};

export const SessionTableRow = ({ session, onNavigate, onDelete }: SessionTableRowProps) => {
  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => onNavigate(session.id)}
    >
      <TableCell className="font-medium">{session.name}</TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={getStatusColor(session.status)}>
              {session.status.replace(/_/g, ' ')}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            {getStatusTooltip(session.status)}
          </TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell>
        {session.users && session.users.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {session.users.map((user) => (
              <Badge 
                key={user.id} 
                variant="secondary"
              >
                {user.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">No participants yet</span>
        )}
      </TableCell>
      <TableCell>
        {new Date(session.created_at).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(session.id);
              }}
              className="w-8 h-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            Delete this session and all associated data
          </TooltipContent>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};
