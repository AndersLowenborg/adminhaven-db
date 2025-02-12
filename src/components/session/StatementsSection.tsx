
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Statement } from '@/types/statement';

interface StatementsSectionProps {
  statements: Statement[];
  isAddingStatement: boolean;
  newStatement: string;
  onNewStatementChange: (value: string) => void;
  onAddClick: () => void;
  onCancelAdd: () => void;
  onSubmitStatement: (e: React.FormEvent) => void;
  onDeleteStatement: (id: number) => void;
  onUpdateStatement: (id: number, content: string, description?: string) => void;
  isAddingStatementPending: boolean;
  isDeletingStatementPending: boolean;
  newBackground?: string;
  onNewBackgroundChange?: (value: string) => void;
  sessionStatus: string;
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
  isAddingStatementPending,
  isDeletingStatementPending,
  newBackground,
  onNewBackgroundChange,
  sessionStatus,
}: StatementsSectionProps) => {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editedContent, setEditedContent] = React.useState("");
  const [editedBackground, setEditedBackground] = React.useState("");
  const [statementToDelete, setStatementToDelete] = React.useState<number | null>(null);

  const handleEditClick = (statement: Statement) => {
    setEditingId(statement.id);
    setEditedContent(statement.statement || "");
    setEditedBackground(statement.description || "");
  };

  const handleSaveEdit = (id: number) => {
    if (editedContent.trim()) {
      onUpdateStatement(id, editedContent.trim(), editedBackground.trim() || undefined);
      setEditingId(null);
      setEditedContent("");
      setEditedBackground("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedContent("");
    setEditedBackground("");
  };

  const handleDelete = (id: number) => {
    onDeleteStatement(id);
    setStatementToDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-[#403E43]">Statements</h2>
        <Button onClick={onAddClick} disabled={isAddingStatement}>
          Add Statement
        </Button>
      </div>

      {isAddingStatement && (
        <form onSubmit={onSubmitStatement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#403E43]">Statement</label>
            <Input
              value={newStatement}
              onChange={(e) => onNewStatementChange(e.target.value)}
              placeholder="Enter statement content"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#403E43]">Background/Context (Optional)</label>
            <Textarea
              value={newBackground}
              onChange={(e) => onNewBackgroundChange?.(e.target.value)}
              placeholder="Enter background or context for this statement"
              className="w-full"
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit" disabled={isAddingStatementPending}>
              {isAddingStatementPending ? "Adding..." : "Add"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancelAdd}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Statement</TableHead>
            <TableHead>Background</TableHead>
            <TableHead className="w-[250px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements?.map((statement) => (
            <TableRow key={statement.id}>
              <TableCell>
                {editingId === statement.id ? (
                  <div className="space-y-4">
                    <Input
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full"
                    />
                    <Textarea
                      value={editedBackground}
                      onChange={(e) => setEditedBackground(e.target.value)}
                      placeholder="Enter background or context"
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(statement.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#403E43]">{statement.statement}</div>
                )}
              </TableCell>
              <TableCell className="text-[#8E9196]">
                {editingId !== statement.id && statement.description}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {editingId !== statement.id && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(statement)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setStatementToDelete(statement.id)}
                        disabled={isDeletingStatementPending}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {!statements?.length && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-[#8E9196]">
                No statements found. Add one to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!statementToDelete} onOpenChange={() => setStatementToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Statement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this statement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatementToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => statementToDelete && handleDelete(statementToDelete)}
              disabled={isDeletingStatementPending}
            >
              {isDeletingStatementPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
