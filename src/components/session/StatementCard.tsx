
import { Card } from "@/components/ui/card";
import { Statement } from "@/types/statement";
import { StatementControls } from "./StatementControls";
import { EditStatementDialog } from "./EditStatementDialog";
import { useState } from "react";

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
  ...controlProps
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditSubmit = (content: string, description?: string) => {
    controlProps.onUpdateStatement(statement.id, content, description);
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
            <StatementControls
              {...controlProps}
              onEndRound={() => controlProps.onEndRound(statement.id)}
              onStartRound={() => controlProps.onStartRound(statement.id)}
              handleGroupPreparation={() => controlProps.handleGroupPreparation(statement.id)}
              handleToggleResults={() => controlProps.handleToggleResults(statement.id)}
              onUpdateStatement={() => setIsEditDialogOpen(true)}
              onDeleteStatement={() => controlProps.onDeleteStatement(statement.id)}
            />
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
