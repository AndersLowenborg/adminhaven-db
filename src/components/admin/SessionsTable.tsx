
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionContext } from '@supabase/auth-helpers-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SessionUser {
  id: number;
  name: string | null;
  session_id: number | null;
}

interface Session {
  id: number;
  name: string | null;
  status: 'UNPUBLISHED' | 'PUBLISHED' | 'STARTED' | 'ENDED';
  created_at: string;
  users?: SessionUser[];
}

interface SessionsTableProps {
  sessions: Session[];
}

export const SessionsTable = ({ sessions }: SessionsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session: authSession } = useSessionContext();
  const [sessionToDelete, setSessionToDelete] = React.useState<number | null>(null);

  const handleDelete = async (sessionId: number): Promise<void> => {
    try {
      console.log('Attempting to delete session:', sessionId);
      
      // Get all rounds for this session
      const { data: rounds, error: roundsError } = await supabase
        .from('ROUND')
        .select('id')
        .eq('session_id', sessionId);

      if (roundsError) throw roundsError;

      // Get all groups associated with these rounds
      const roundIds = rounds?.map(round => round.id) || [];
      const { data: roundGroups, error: groupsError } = await supabase
        .from('ROUND_GROUPS')
        .select('group_id')
        .in('round_id', roundIds);

      if (groupsError) throw groupsError;

      // Delete the groups
      const groupIds = [...new Set(roundGroups?.map(rg => rg.group_id) || [])];
      if (groupIds.length > 0) {
        const { error: deleteGroupsError } = await supabase
          .from('GROUP')
          .delete()
          .in('id', groupIds);

        if (deleteGroupsError) throw deleteGroupsError;
      }

      // Finally delete the session (this will cascade delete rounds and round_groups)
      const { error: deleteSessionError } = await supabase
        .from('SESSION')
        .delete()
        .eq('id', sessionId);

      if (deleteSessionError) throw deleteSessionError;

      console.log('Successfully deleted session:', sessionId);
      
      queryClient.invalidateQueries({ 
        queryKey: ['admin-sessions', authSession?.user?.id] 
      });

      toast({
        title: "Success",
        description: "Session deleted successfully",
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSessionToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'UNPUBLISHED':
        return 'secondary';
      case 'PUBLISHED':
        return 'default';
      case 'STARTED':
        return 'default';
      case 'ENDED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <TooltipProvider>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="min-w-[200px]">Participants</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions?.map((session) => (
              <TableRow
                key={session.id}
                className="cursor-pointer"
                onClick={() => navigate(`/admin/session/${session.id}`)}
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
                      {session.status === 'UNPUBLISHED' && "Session is not yet available to participants"}
                      {session.status === 'PUBLISHED' && "Session is open for participants to join"}
                      {session.status === 'STARTED' && "Session is locked and in progress"}
                      {session.status === 'ENDED' && "Session has been completed"}
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
                          setSessionToDelete(session.id);
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
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this session? This action cannot be undone.
              All associated data including statements and responses will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSessionToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => sessionToDelete && handleDelete(sessionToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
