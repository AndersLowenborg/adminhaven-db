import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Unlock } from "lucide-react";
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
  onUpdateStatement: (id: number, content: string) => void;
  onToggleLock: (id: number, currentStatus: string) => void;
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
  onUpdateStatement,
  onToggleLock,
  isAddingStatementPending,
  isDeletingStatementPending,
}: StatementsSectionProps) => {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editedContent, setEditedContent] = React.useState("");

  const handleEditClick = (statement: Statement) => {
    setEditingId(statement.id);
    setEditedContent(statement.content);
  };

  const handleSaveEdit = (id: number) => {
    if (editedContent.trim()) {
      onUpdateStatement(id, editedContent.trim());
      setEditingId(null);
      setEditedContent("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedContent("");
  };

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
            <TableHead className="w-[250px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements?.map((statement) => (
            <TableRow key={statement.id}>
              <TableCell>
                {editingId === statement.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={() => handleSaveEdit(statement.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  statement.content
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {editingId !== statement.id && statement.status !== 'locked' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(statement)}
                    >
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onToggleLock(statement.id, statement.status)}
                  >
                    {statement.status === 'locked' ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteStatement(statement.id)}
                    disabled={isDeletingStatementPending}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!statements?.length && (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                No statements found. Add one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};