
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSession } from '@/types/admin-session';
import { SessionTableRow } from './SessionTableRow';
import { DeleteSessionDialog } from './DeleteSessionDialog';

interface SessionsTableProps {
  sessions: AdminSession[];
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
      
      const { data: rounds, error: roundsError } = await supabase
        .from('ROUND')
        .select('id')
        .eq('session_id', sessionId);

      if (roundsError) throw roundsError;

      const roundIds = rounds?.map(round => round.id) || [];
      const { data: roundGroups, error: groupsError } = await supabase
        .from('ROUND_GROUPS')
        .select('group_id')
        .in('round_id', roundIds);

      if (groupsError) throw groupsError;

      const groupIds = [...new Set(roundGroups?.map(rg => rg.group_id) || [])];
      if (groupIds.length > 0) {
        const { error: deleteGroupsError } = await supabase
          .from('GROUP')
          .delete()
          .in('id', groupIds);

        if (deleteGroupsError) throw deleteGroupsError;
      }

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
              <SessionTableRow
                key={session.id}
                session={session}
                onNavigate={(id) => navigate(`/admin/session/${id}`)}
                onDelete={(id) => setSessionToDelete(id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <DeleteSessionDialog
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => sessionToDelete && handleDelete(sessionToDelete)}
      />
    </TooltipProvider>
  );
};
