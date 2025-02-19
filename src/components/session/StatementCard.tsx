
import { Card } from "@/components/ui/card";
import { Statement } from "@/types/statement";
import { StatementControls } from "./StatementControls";
import { EditStatementDialog } from "./EditStatementDialog";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

interface StatementCardProps {
  statement: Statement;
  currentRound: number | null;
  currentRoundStatus: string | null;
  showLockButton: boolean;
  isLockButtonEnabled: boolean;
  isPlayButtonEnabled: boolean;
  canStartPrepareGroups: boolean;
  isShowingResults: boolean;
  hasActiveRound: boolean;
  sessionStatus: string;
  canDeleteStatements: boolean;
  isDeletingStatementPending: boolean;
  groupCount: number | null;
  onEndRound: (id: number) => void;
  onStartRound: (id: number) => void;
  handleGroupPreparation: (id: number) => void;
  handleToggleResults: (id: number) => void;
  onUpdateStatement: (id: number, content: string, description?: string) => void;
  onDeleteStatement: (id: number) => void;
}

export const StatementCard: React.FC<StatementCardProps> = ({
  statement,
  currentRound,
  currentRoundStatus,
  showLockButton,
  isLockButtonEnabled,
  isPlayButtonEnabled,
  canStartPrepareGroups,
  isShowingResults,
  hasActiveRound,
  sessionStatus,
  canDeleteStatements,
  isDeletingStatementPending,
  groupCount,
  onEndRound,
  onStartRound,
  handleGroupPreparation,
  handleToggleResults,
  onUpdateStatement,
  onDeleteStatement,
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditSubmit = (content: string, description?: string) => {
    onUpdateStatement(statement.id, content, description);
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="font-medium text-lg">{statement.statement}</div>
        {statement.description && (
          <div className="text-muted-foreground">{statement.description}</div>
        )}
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Current Round: {currentRound || 'Not started'}
            {currentRoundStatus && ` (${currentRoundStatus})`}
          </span>
          <div className="ml-auto">
            <TooltipProvider>
              <StatementControls
                {...{
                  showLockButton,
                  isLockButtonEnabled,
                  isPlayButtonEnabled,
                  canStartPrepareGroups,
                  isShowingResults,
                  hasActiveRound,
                  sessionStatus,
                  canDeleteStatements,
                  isDeletingStatementPending,
                  currentRound,
                  currentRoundStatus,
                  groupCount,
                  onEndRound: () => onEndRound(statement.id),
                  onStartRound: () => onStartRound(statement.id),
                  handleGroupPreparation: () => handleGroupPreparation(statement.id),
                  handleToggleResults: () => handleToggleResults(statement.id),
                  onUpdateStatement: () => setIsEditDialogOpen(true),
                  onDeleteStatement: () => onDeleteStatement(statement.id),
                }}
              />
            </TooltipProvider>
          </div>
        </div>
      </div>
      <EditStatementDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        statement={statement.statement || ""}
        description={statement.description}
        onSubmit={handleEditSubmit}
      />
    </Card>
  );
};
