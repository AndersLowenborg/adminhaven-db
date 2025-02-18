
import { Button } from "@/components/ui/button";
import { 
  PlayIcon,
  PauseIcon,
  LineChartIcon,
  PencilIcon,
  TrashIcon,
  UsersRoundIcon,
  LockIcon
} from "lucide-react";

interface StatementControlsProps {
  showLockButton: boolean;
  isLockButtonEnabled: boolean;
  isPlayButtonEnabled: boolean;
  canStartPrepareGroups: boolean;
  isShowingResults: boolean;
  hasActiveRound: boolean;
  sessionStatus: string;
  canDeleteStatements: boolean;
  isDeletingStatementPending: boolean;
  onEndRound: () => void;
  onStartRound: () => void;
  handleGroupPreparation: () => void;
  handleToggleResults: () => void;
  onUpdateStatement: () => void;
  onDeleteStatement: () => void;
}

export const StatementControls: React.FC<StatementControlsProps> = ({
  showLockButton,
  isLockButtonEnabled,
  isPlayButtonEnabled,
  canStartPrepareGroups,
  isShowingResults,
  hasActiveRound,
  sessionStatus,
  canDeleteStatements,
  isDeletingStatementPending,
  onEndRound,
  onStartRound,
  handleGroupPreparation,
  handleToggleResults,
  onUpdateStatement,
  onDeleteStatement,
}) => {
  return (
    <div className="flex items-center gap-2">
      {showLockButton ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEndRound}
          disabled={!isLockButtonEnabled}
          className="hover:bg-secondary hover:text-primary text-primary"
        >
          <LockIcon className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={onStartRound}
          disabled={!isPlayButtonEnabled}
          className="hover:bg-secondary hover:text-primary"
        >
          <PlayIcon className="h-4 w-4" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleGroupPreparation}
        disabled={!canStartPrepareGroups}
        className={`hover:bg-secondary hover:text-primary ${canStartPrepareGroups ? "" : "text-primary"}`}
      >
        <UsersRoundIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleResults}
        className={`hover:bg-secondary hover:text-primary ${isShowingResults ? "bg-secondary text-primary" : ""}`}
      >
        <LineChartIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onUpdateStatement}
        disabled={hasActiveRound || sessionStatus === 'ENDED'}
        className="hover:bg-secondary hover:text-primary"
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDeleteStatement}
        disabled={!canDeleteStatements || isDeletingStatementPending}
        className="hover:bg-secondary hover:text-destructive text-destructive"
      >
        <TrashIcon className="h-4 w-4" />
      </Button>
    </div>
  );
};
