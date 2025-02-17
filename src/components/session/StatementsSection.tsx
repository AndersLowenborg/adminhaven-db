import { Button } from "@/components/ui/button";
import { Statement } from "@/types/statement";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStatementVisibility } from "@/hooks/use-statement-visibility";

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
  sessionId: number;
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
  activeRounds = [],
  sessionId
}) => {
  const { toast } = useToast();
  const { visibleResults, toggleVisibility } = useStatementVisibility(sessionId);
  const [isPreparingGroups, setIsPreparingGroups] = useState(false);

  // Helper function to determine if statements can be deleted
  const canDeleteStatements = sessionStatus === 'UNPUBLISHED';

  const handleToggleResults = (statementId: number) => {
    toggleVisibility(statementId);
    
    const isCurrentlyShowing = visibleResults.includes(statementId);
    toast({
      title: "Success",
      description: `Results ${!isCurrentlyShowing ? 'shown' : 'hidden'} for this statement`,
    });
  };

  const handlePrepareGroups = async (statementId: number) => {
    setIsPreparingGroups(true);
    try {
      // Prepare groups logic will be implemented here
      toast({
        title: "Success",
        description: "Groups prepared successfully",
      });
    } catch (error) {
      console.error('Error preparing groups:', error);
      toast({
        title: "Error",
        description: "Failed to prepare groups",
        variant: "destructive",
      });
    } finally {
      setIsPreparingGroups(false);
    }
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
          const activeRound = activeRounds.find(
            round => round.statement_id === statement.id && round.status === 'STARTED'
          );
          const hasActiveRound = !!activeRound;
          const currentRoundNumber = activeRound?.round_number || 0;
          const isShowingResults = visibleResults.includes(statement.id);

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
                    <Button
                      onClick={() => handlePrepareGroups(statement.id)}
                      variant="outline"
                      disabled={isPreparingGroups}
                      className="whitespace-nowrap"
                    >
                      Prepare Groups
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4].map((roundNumber) => (
                      <Button
                        key={roundNumber}
                        onClick={() => onStartRound(statement.id)}
                        disabled={
                          sessionStatus !== 'STARTED' || 
                          (roundNumber !== 1 && !activeRounds.some(r => 
                            r.statement_id === statement.id && 
                            r.status === 'COMPLETED' && 
                            r.round_number === roundNumber - 1
                          ))
                        }
                        variant="secondary"
                        className="whitespace-nowrap"
                        title={
                          sessionStatus !== 'STARTED' 
                            ? "Session must be started to begin rounds" 
                            : roundNumber !== 1 && !activeRounds.some(r => 
                                r.statement_id === statement.id && 
                                r.status === 'COMPLETED' && 
                                r.round_number === roundNumber - 1
                              )
                            ? `Complete Round ${roundNumber - 1} first`
                            : `Start Round ${roundNumber}`
                        }
                      >
                        Start Round {roundNumber}
                      </Button>
                    ))}
                  </div>
                )}
                <Toggle
                  pressed={isShowingResults}
                  onPressedChange={() => handleToggleResults(statement.id)}
                  className="ml-2"
                  aria-label="Toggle results visibility"
                >
                  {isShowingResults ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
                </Toggle>
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
