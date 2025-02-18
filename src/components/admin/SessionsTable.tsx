
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
import { SessionWithUsers } from '@/types/session';

interface SessionsTableProps {
  sessions: SessionWithUsers[];
}

export const SessionsTable = ({ sessions }: SessionsTableProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session: authSession } = useSessionContext();
  const [sessionToDelete, setSessionToDelete] = React.useState<number | null>(null);

  const handleDelete = async (sessionId: number) => {
    try {
      console.log('Attempting to delete session and related data:', sessionId);

      // 1. First get all statements for this session
      const { data: statements } = await supabase
        .from('STATEMENT')
        .select('id')
        .eq('session_id', sessionId);

      if (statements && statements.length > 0) {
        const statementIds = statements.map(s => s.id);

        // 2. Get all rounds for these statements
        const { data: rounds } = await supabase
          .from('ROUND')
          .select('id')
          .in('statement_id', statementIds);

        if (rounds && rounds.length > 0) {
          const roundIds = rounds.map(r => r.id);

          // 3. Delete answers for these rounds
          await supabase
            .from('ANSWER')
            .delete()
            .in('round_id', roundIds);

          // 4. Get and delete round_groups and associated groups
          const { data: roundGroups } = await supabase
            .from('ROUND_GROUPS')
            .select('groups_id')
            .in('round_id', roundIds);

          if (roundGroups && roundGroups.length > 0) {
            const groupIds = roundGroups.map(rg => rg.groups_id).filter(Boolean);

            // Delete group members first
            await supabase
              .from('GROUP_MEMBERS')
              .delete()
              .in('parent_groups_id', groupIds);

            // Delete the groups
            await supabase
              .from('GROUPS')
              .delete()
              .in('id', groupIds);

            // Delete round_groups
            await supabase
              .from('ROUND_GROUPS')
              .delete()
              .in('round_id', roundIds);
          }

          // 5. Delete rounds
          await supabase
            .from('ROUND')
            .delete()
            .in('statement_id', statementIds);
        }

        // 6. Delete statements
        await supabase
          .from('STATEMENT')
          .delete()
          .eq('session_id', sessionId);
      }

      // 7. Delete session users
      await supabase
        .from('SESSION_USERS')
        .delete()
        .eq('session_id', sessionId);

      // 8. Finally, delete the session
      const { error: deleteSessionError } = await supabase
        .from('SESSION')
        .delete()
        .eq('id', sessionId);

      if (deleteSessionError) {
        throw deleteSessionError;
      }

      console.log('Successfully deleted session and related data:', sessionId);
      
      queryClient.invalidateQueries({ 
        queryKey: ['admin-sessions', authSession?.user?.id] 
      });

      toast({
        title: "Success",
        description: "Session and all related data deleted successfully",
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
    <>
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
                  <Badge variant={getStatusColor(session.status)}>
                    {session.status.replace(/_/g, ' ')}
                  </Badge>
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
              All associated data including statements, rounds, groups, and responses will be permanently deleted.
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
    </>
  );
};
