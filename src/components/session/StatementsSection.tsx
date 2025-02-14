
import { Button } from "@/components/ui/button";
import { Statement } from "@/types/statement";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface StatementsSectionProps {
  statements: Statement[];
  isAddingStatement: boolean;
  newStatement: string;
  newBackground: string;
  onNewStatementChange: (value: string) => void;
  onNewBackgroundChange: (value: string) => void;
  onAddClick: () => void;
  onCancelAdd: () => void;
  onSubmitStatement: (e: React.FormEvent) => void;
  onDeleteStatement: (id: number) => void;
  onUpdateStatement: (id: number, content: string, description?: string) => void;
  isAddingStatementPending: boolean;
  isDeletingStatementPending: boolean;
  sessionStatus: string;
  onStartRound: (statementId: number) => void;
  onEndRound: (statementId: number) => void;
  activeRounds?: { statement_id: number; status: string; round_number: number }[];
}

export const StatementsSection: React.FC<StatementsSectionProps> = ({
  statements,
  isAddingStatement,
  newStatement,
  newBackground,
  onNewStatementChange,
  onNewBackgroundChange,
  onAddClick,
  onCancelAdd,
  onSubmitStatement,
  onDeleteStatement,
  onUpdateStatement,
  isAddingStatementPending,
  isDeletingStatementPending,
  sessionStatus,
  onStartRound,
  onEndRound,
  activeRounds = []
}) => {
  const { toast } = useToast();
  const [showingResultsFor, setShowingResultsFor] = useState<number[]>([]);

  // Helper function to determine if statements can be deleted
  const canDeleteStatements = sessionStatus === 'UNPUBLISHED';

  // Get the last completed round number for a statement
  const getLastRoundNumber = (statementId: number) => {
    const statementRounds = activeRounds.filter(round => round.statement_id === statementId);
    if (statementRounds.length === 0) return 0;
    return Math.max(...statementRounds.map(r => r.round_number));
  };

  const handleToggleResults = (statementId: number) => {
    const isCurrentlyShowing = showingResultsFor.includes(statementId);
    
    if (isCurrentlyShowing) {
      setShowingResultsFor(prev => prev.filter(id => id !== statementId));
    } else {
      setShowingResultsFor(prev => [...prev, statementId]);
    }

    toast({
      title: "Success",
      description: `Results ${isCurrentlyShowing ? 'hidden' : 'shown'} for this statement`,
    });
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Statements</h2>
        <Button 
          onClick={onAddClick}
          disabled={isAddingStatement || sessionStatus === 'ENDED'}
          title={sessionStatus === 'ENDED' ? "Cannot add statements to ended session" : ""}
        >
          Add Statement
        </Button>
      </div>

      {isAddingStatement && (
        <form onSubmit={onSubmitStatement} className="mb-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="statement" className="block text-sm font-medium mb-1">
                  Statement
                </label>
                <Input
                  id="statement"
                  value={newStatement}
                  onChange={(e) => onNewStatementChange(e.target.value)}
                  placeholder="Enter statement"
                  required
                />
              </div>
              <div>
                <label htmlFor="background" className="block text-sm font-medium mb-1">
                  Background (optional)
                </label>
                <Textarea
                  id="background"
                  value={newBackground}
                  onChange={(e) => onNewBackgroundChange(e.target.value)}
                  placeholder="Enter background information"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isAddingStatementPending}>
                  Save
                </Button>
                <Button type="button" variant="outline" onClick={onCancelAdd}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </form>
      )}

      <div className="grid gap-4">
        <div className="grid grid-cols-[1fr,1fr,auto] gap-4 px-4 py-2 bg-muted rounded-lg">
          <div>Statement</div>
          <div>Background</div>
          <div>Actions</div>
        </div>
        
        {statements.map((statement) => {
          const hasActiveRound = activeRounds.some(
            round => round.statement_id === statement.id && round.status === 'STARTED'
          );
          
          const currentRoundNumber = hasActiveRound 
            ? activeRounds.find(round => round.statement_id === statement.id && round.status === 'STARTED')?.round_number 
            : getLastRoundNumber(statement.id) + 1;

          const isShowingResults = showingResultsFor.includes(statement.id);

          return (
            <Card key={statement.id} className="p-4 grid grid-cols-[1fr,1fr,auto] gap-4">
              <div>{statement.statement}</div>
              <div>{statement.description || '-'}</div>
              <div className="flex items-center gap-2">
                {hasActiveRound ? (
                  <>
                    <Button
                      onClick={() => onEndRound(statement.id)}
                      variant="secondary"
                      className="whitespace-nowrap"
                    >
                      End Round {currentRoundNumber}
                    </Button>
                    <Toggle
                      pressed={isShowingResults}
                      onPressedChange={() => handleToggleResults(statement.id)}
                      className="ml-2"
                      aria-label="Toggle results visibility"
                    >
                      {isShowingResults ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                    </Toggle>
                  </>
                ) : (
                  <Button
                    onClick={() => onStartRound(statement.id)}
                    disabled={sessionStatus !== 'STARTED'}
                    variant="secondary"
                    className="whitespace-nowrap"
                    title={sessionStatus !== 'STARTED' ? "Session must be started to begin rounds" : ""}
                  >
                    Start Round {currentRoundNumber}
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatement(statement.id, statement.statement || '', statement.description || '')}
                  disabled={hasActiveRound || sessionStatus === 'ENDED'}
                  title={
                    sessionStatus === 'ENDED' ? "Cannot edit statements in ended session" :
                    hasActiveRound ? "Cannot edit statement while round is active" : ""
                  }
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDeleteStatement(statement.id)}
                  disabled={!canDeleteStatements || isDeletingStatementPending}
                  title={!canDeleteStatements ? "Can only delete statements when session is unpublished" : ""}
                >
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
