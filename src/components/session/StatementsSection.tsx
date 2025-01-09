import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Statement {
  id: number;
  content: string;
  status: string;
  created_at: string;
}

interface StatementsSectionProps {
  statements: Statement[];
  isAddingStatement: boolean;
  newStatement: string;
  onNewStatementChange: (value: string) => void;
  onAddClick: () => void;
  onCancelAdd: () => void;
  onSubmitStatement: (e: React.FormEvent) => void;
  onDeleteStatement: (id: number) => void;
  isAddingStatementPending: boolean;
  isDeletingStatementPending: boolean;
}

export const StatementsSection = ({
  statements,
  isAddingStatement,
  newStatement,
  onNewStatementChange,
  onAddClick,
  onCancelAdd,
  onSubmitStatement,
  onDeleteStatement,
  isAddingStatementPending,
  isDeletingStatementPending,
}: StatementsSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Statements</h2>
        <Button onClick={onAddClick} disabled={isAddingStatement}>
          Add Statement
        </Button>
      </div>

      {isAddingStatement && (
        <form onSubmit={onSubmitStatement} className="flex gap-4">
          <Input
            value={newStatement}
            onChange={(e) => onNewStatementChange(e.target.value)}
            placeholder="Enter statement content"
            className="flex-1"
          />
          <Button type="submit" disabled={isAddingStatementPending}>
            {isAddingStatementPending ? "Adding..." : "Add"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancelAdd}>
            Cancel
          </Button>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Statement</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements?.map((statement) => (
            <TableRow key={statement.id}>
              <TableCell>{statement.content}</TableCell>
              <TableCell>{statement.status}</TableCell>
              <TableCell>
                {new Date(statement.created_at || '').toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDeleteStatement(statement.id)}
                  disabled={isDeletingStatementPending}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!statements?.length && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No statements found. Add one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};