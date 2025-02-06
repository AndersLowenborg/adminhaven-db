
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, Square, Timer, BarChart2 } from "lucide-react";
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
import { ScatterChart, Scatter, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
  '#F1C40F', '#E74C3C', '#1ABC9C', '#34495E', '#95A5A6'
];

interface Statement {
  id: number;
  content: string;
  background?: string;
  status: string;
  created_at: string;
  timer_seconds?: number;
  timer_started_at?: string;
  timer_status?: string;
}

interface Answer {
  agreement_level: number;
  confidence_level: number;
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
  isAddingStatementPending: boolean;
  isDeletingStatementPending: boolean;
  newBackground?: string;
  onNewBackgroundChange?: (value: string) => void;
  onStartTimer: (id: number, seconds: number) => void;
  onStopTimer: (id: number) => void;
  sessionStatus: string;
  answers?: Record<number, Answer[]>;
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
  isAddingStatementPending,
  isDeletingStatementPending,
  newBackground,
  onNewBackgroundChange,
  onStartTimer,
  onStopTimer,
  sessionStatus,
  answers,
}: StatementsSectionProps) => {
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [editedContent, setEditedContent] = React.useState("");
  const [editedBackground, setEditedBackground] = React.useState("");
  const [statementToDelete, setStatementToDelete] = React.useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState<number>(300); // Default 5 minutes
  const [showingResultsFor, setShowingResultsFor] = useState<number | null>(null);

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

  const prepareChartData = (statementAnswers: Answer[] = []) => {
    return statementAnswers.map((answer, index) => ({
      x: answer.agreement_level,
      y: answer.confidence_level,
      agreement: answer.agreement_level,
      confidence: answer.confidence_level,
      colorIndex: index % COLORS.length
    }));
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
        <form onSubmit={onSubmitStatement} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Statement</label>
            <Input
              value={newStatement}
              onChange={(e) => onNewStatementChange(e.target.value)}
              placeholder="Enter statement content"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Background/Context (Optional)</label>
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
            <TableHead className="w-[350px]">Actions</TableHead>
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
                  <>
                    <div>{statement.content}</div>
                    {showingResultsFor === statement.id && answers?.[statement.id] && (
                      <div className="mt-4 h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
                            <XAxis 
                              type="number" 
                              dataKey="x" 
                              name="Agreement" 
                              domain={[0, 10]}
                              tickCount={11}
                              label={{ value: 'Agreement Level', position: 'bottom' }}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="y" 
                              name="Confidence"
                              domain={[0, 10]}
                              tickCount={11}
                              label={{ value: 'Confidence Level', angle: -90, position: 'insideLeft' }}
                            />
                            <Scatter data={prepareChartData(answers[statement.id])}>
                              {prepareChartData(answers[statement.id]).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[entry.colorIndex]}
                                />
                              ))}
                            </Scatter>
                          </ScatterChart>
                        </ResponsiveContainer>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Total responses: {answers[statement.id]?.length || 0}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TableCell>
              <TableCell>
                {editingId !== statement.id && statement.background}
              </TableCell>
              <TableCell>
                {statement.timer_status === 'running' ? (
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    <span>Timer running</span>
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
                        <h4 className="font-medium">Set Timer Duration</h4>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={timerSeconds}
                            onChange={(e) => setTimerSeconds(parseInt(e.target.value))}
                            min="1"
                            placeholder="Seconds"
                          />
                          <Button
                            onClick={() => handleStartTimer(statement.id)}
                          >
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
                        variant="outline"
                        size="sm"
                        onClick={() => setShowingResultsFor(showingResultsFor === statement.id ? null : statement.id)}
                      >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        {showingResultsFor === statement.id ? 'Hide Results' : 'Show Results'}
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
              <TableCell colSpan={4} className="text-center text-muted-foreground">
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

