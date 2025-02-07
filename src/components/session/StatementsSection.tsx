import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, Timer } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Statement {
  id: number;
  content: string;
  background?: string;
  status: string;
  created_at: string;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: string;
  show_results?: boolean;
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
  onUpdateStatement: (id: number, content: string, background?: string) => void;
  onToggleStatementStatus: (id: number, currentStatus: string) => void;
  onToggleShowResults: (id: number, currentShowResults: boolean) => void;
  isAddingStatementPending: boolean;
  isDeletingStatementPending: boolean;
  newBackground?: string;
  onNewBackgroundChange?: (value: string) => void;
  onStartTimer: (id: number, seconds: number) => void;
  onStopTimer: (id: number) => void;
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
  onToggleStatementStatus,
  onToggleShowResults,
  isAddingStatementPending,
  isDeletingStatementPending,
  newBackground,
  onNewBackgroundChange,
  onStartTimer,
  onStopTimer,
  sessionStatus,
}: StatementsSectionProps) => {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editedContent, setEditedContent] = React.useState("");
  const [editedBackground, setEditedBackground] = React.useState("");
  const [statementToDelete, setStatementToDelete] = React.useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // Default 5 minutes

  const handleEditClick = (statement: Statement) => {
    setEditingId(statement.id);
    setEditedContent(statement.content);
    setEditedBackground(statement.background || "");
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

  const handleStartTimer = (id: number) => {
    onStartTimer(id, timerSeconds);
  };

  const isSessionActive = sessionStatus === 'started';

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
            <TableHead>Timer</TableHead>
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
                  <div className="text-[#403E43]">{statement.content}</div>
                )}
              </TableCell>
              <TableCell className="text-[#8E9196]">
                {editingId !== statement.id && statement.background}
              </TableCell>
              <TableCell>
                {statement.timer_status === 'running' ? (
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span className="text-[#403E43]">Timer running</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStopTimer(statement.id)}
                    >
                      Stop Timer
                    </Button>
                  </div>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Timer className="h-4 w-4 mr-2" />
                        Set Timer
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-4">
                        <h4 className="font-medium text-[#403E43]">Set Timer Duration</h4>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={timerSeconds}
                            onChange={(e) => setTimerSeconds(parseInt(e.target.value))}
                            min="1"
                            placeholder="Seconds"
                          />
                          <Button onClick={() => handleStartTimer(statement.id)}>
                            Start
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
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
                        variant={statement.status === 'active' ? "destructive" : "default"}
                        size="sm"
                        onClick={() => onToggleStatementStatus(statement.id, statement.status)}
                        disabled={!isSessionActive}
                      >
                        {statement.status === 'active' ? (
                          <Square className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant={statement.show_results ? "default" : "outline"}
                        size="sm"
                        onClick={() => onToggleShowResults(statement.id, !!statement.show_results)}
                      >
                        {statement.show_results ? 'Hide Results' : 'Show Results'}
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
              <TableCell colSpan={4} className="text-center text-[#8E9196]">
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
              All associated responses will be permanently deleted.
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
