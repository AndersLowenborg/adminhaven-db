import { Button } from "@/components/ui/button";
import { Statement } from "@/types/statement";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { 
  PlayIcon,
  PauseIcon,
  LineChartIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  UsersRoundIcon
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStatementVisibility } from "@/hooks/use-statement-visibility";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedRounds, setSelectedRounds] = useState<Record<number, string>>({});

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

  // Helper function to get available round numbers for a statement
  const getAvailableRounds = (statementId: number) => {
    // Always include rounds 1 and 2
    const availableRounds = ["1", "2"];
    
    // Get all rounds for this statement
    const statementRounds = activeRounds.filter(round => 
      round.statement_id === statementId && 
      (round.status === 'STARTED' || round.status === 'COMPLETED')
    );

    // Add round 3 if round 2 is started or completed
    if (statementRounds.some(round => round.round_number === 2)) {
      availableRounds.push("3");
    }

    // Add round 4 if round 3 is started or completed
    if (statementRounds.some(round => round.round_number === 3)) {
      availableRounds.push("4");
    }

    return availableRounds;
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Statements</h2>
        <Button 
          onClick={onAddClick}
          disabled={isAddingStatement || sessionStatus === 'ENDED'}
          className="bg-[#FF5D0A] hover:bg-[#FF5D0A]/90"
        >
          + Add Statement
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

      <div className="space-y-4">
        {statements.map((statement) => {
          const activeRound = activeRounds.find(
            round => round.statement_id === statement.id && round.status === 'STARTED'
          );
          const hasActiveRound = !!activeRound;
          const currentRoundNumber = selectedRounds[statement.id] || "1";
          const isShowingResults = visibleResults.includes(statement.id);
          const availableRounds = getAvailableRounds(statement.id);

          return (
            <Card key={statement.id} className="p-6">
              <div className="space-y-4">
                <div className="font-medium text-lg">{statement.statement}</div>
                {statement.description && (
                  <div className="text-muted-foreground">{statement.description}</div>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <Select
                    value={currentRoundNumber}
                    onValueChange={(value) => setSelectedRounds({
                      ...selectedRounds,
                      [statement.id]: value
                    })}
                  >
                    <SelectTrigger className="w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRounds.map((num) => (
                        <SelectItem 
                          key={num} 
                          value={num}
                          disabled={hasActiveRound || sessionStatus !== 'STARTED'}
                        >
                          {num}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const roundNumber = parseInt(currentRoundNumber);
                      if (hasActiveRound) {
                        onEndRound(statement.id);
                      } else {
                        onStartRound(statement.id);
                      }
                    }}
                    disabled={sessionStatus !== 'STARTED'}
                    className={`hover:bg-orange-50 hover:text-orange-600 ${hasActiveRound ? "text-orange-500" : ""}`}
                  >
                    {hasActiveRound ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleResults(statement.id)}
                    className={`hover:bg-orange-50 hover:text-orange-600 ${isShowingResults ? "bg-orange-100 text-orange-500" : ""}`}
                  >
                    <LineChartIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={!hasActiveRound || sessionStatus !== 'STARTED'}
                    className="hover:bg-orange-50 hover:text-orange-600 text-orange-500"
                  >
                    <UsersRoundIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onUpdateStatement(statement.id, statement.statement || '', statement.description || '')}
                    disabled={hasActiveRound || sessionStatus === 'ENDED'}
                    className="hover:bg-orange-50 hover:text-orange-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteStatement(statement.id)}
                    disabled={!canDeleteStatements || isDeletingStatementPending}
                    className="hover:bg-orange-50 hover:text-orange-600 text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
