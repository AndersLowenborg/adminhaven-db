
import { Card } from "@/components/ui/card";
import { Statement } from "@/types/statement";
import { StatementControls } from "./StatementControls";

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
              onUpdateStatement={() => controlProps.onUpdateStatement(statement.id, statement.statement || '', statement.description || '')}
              onDeleteStatement={() => controlProps.onDeleteStatement(statement.id)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
