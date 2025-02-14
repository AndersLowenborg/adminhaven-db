
import { Button } from "@/components/ui/button";
import { Statement } from "@/types/statement";
import { UseMutateFunction } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
  activeRounds?: { statement_id: number; status: string }[];
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
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Statements</h2>
        <Button 
          onClick={onAddClick}
          disabled={sessionStatus !== 'STARTED'}
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

          return (
            <Card key={statement.id} className="p-4 grid grid-cols-[1fr,1fr,auto] gap-4">
              <div>{statement.statement}</div>
              <div>{statement.description || '-'}</div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onStartRound(statement.id)}
                  disabled={hasActiveRound || sessionStatus !== 'STARTED'}
                  variant="secondary"
                >
                  Start Round
                </Button>
                <Button
                  onClick={() => onEndRound(statement.id)}
                  disabled={!hasActiveRound}
                  variant="secondary"
                >
                  End Round
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onUpdateStatement(statement.id, statement.statement || '', statement.description || '')}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDeleteStatement(statement.id)}
                  disabled={isDeletingStatementPending}
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
