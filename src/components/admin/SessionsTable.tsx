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

interface Session {
  id: number;
  name: string;
  status: string;
  created_at: string;
  users: Array<{ id: number; name: string }>;
}

interface SessionsTableProps {
  sessions: Session[];
}

export const SessionsTable = ({ sessions }: SessionsTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="min-w-[200px]">Participants</TableHead>
            <TableHead>Created At</TableHead>
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
                <Badge variant={session.status === 'unpublished' ? 'secondary' : 'default'}>
                  {session.status}
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};