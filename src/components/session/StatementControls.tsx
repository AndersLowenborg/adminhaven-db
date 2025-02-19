
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  currentRound: number | null;
  currentRoundStatus: string | null;
  groupCount: number | null;
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
  currentRound,
  currentRoundStatus,
  groupCount,
  onEndRound,
  onStartRound,
  handleGroupPreparation,
  handleToggleResults,
  onUpdateStatement,
  onDeleteStatement,
}) => {
  const isFinalRound = currentRound === 4;
  const isRoundLocked = currentRoundStatus === 'LOCKED';
  const hasOnlyOneGroup = groupCount === 1;
  
  const shouldDisableNextRound = 
    (isRoundLocked && hasOnlyOneGroup) || 
    (isRoundLocked && isFinalRound);

  const getPlayButtonTooltip = () => {
    if (sessionStatus !== 'STARTED') {
      return "Session must be started to begin a round";
    }
    if (!isPlayButtonEnabled) {
      return "Cannot start a new round while current round is active";
    }
    if (shouldDisableNextRound) {
      if (isFinalRound) {
        return "Maximum number of rounds reached";
      }
      return "Cannot start new round with only one group";
    }
    return "Start a new round for this statement";
  };

  const getLockButtonTooltip = () => {
    if (!isLockButtonEnabled) {
      return "Waiting for participants to answer before round can be locked";
    }
    return "Lock the current round and prevent further answers";
  };

  const getGroupPreparationTooltip = () => {
    if (!canStartPrepareGroups) {
      return "Round must be locked before preparing groups";
    }
    if (shouldDisableNextRound) {
      if (isFinalRound) {
        return "Maximum number of rounds reached";
      }
      return "Cannot prepare groups when only one group remains";
    }
    return "Form groups for the next round based on current answers";
  };

  const getEditTooltip = () => {
    if (hasActiveRound) {
      return "Cannot edit statement while round is active";
    }
    if (sessionStatus === 'ENDED') {
      return "Cannot edit statement after session has ended";
    }
    return "Edit this statement";
  };

  const getDeleteTooltip = () => {
    if (!canDeleteStatements) {
      return "Cannot delete statement after session is published";
    }
    if (isDeletingStatementPending) {
      return "Deleting statement...";
    }
    return "Delete this statement";
  };

  return (
    <div className="flex items-center gap-2">
      {showLockButton ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onEndRound}
                disabled={!isLockButtonEnabled}
                className="hover:bg-secondary hover:text-primary text-primary"
              >
                <LockIcon className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getLockButtonTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                variant="ghost"
                size="icon"
                onClick={onStartRound}
                disabled={!isPlayButtonEnabled || shouldDisableNextRound}
                className="hover:bg-secondary hover:text-primary"
              >
                <PlayIcon className="h-4 w-4" />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getPlayButtonTooltip()}</p>
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGroupPreparation}
              disabled={!canStartPrepareGroups || shouldDisableNextRound}
              className={`hover:bg-secondary hover:text-primary ${canStartPrepareGroups ? "" : "text-primary"}`}
            >
              <UsersRoundIcon className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getGroupPreparationTooltip()}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleResults}
              className={`hover:bg-secondary hover:text-primary ${isShowingResults ? "bg-secondary text-primary" : ""}`}
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isShowingResults ? "Hide results for this statement" : "Show results for this statement"}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUpdateStatement}
              disabled={hasActiveRound || sessionStatus === 'ENDED'}
              className="hover:bg-secondary hover:text-primary"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getEditTooltip()}</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteStatement}
              disabled={!canDeleteStatements || isDeletingStatementPending}
              className="hover:bg-secondary hover:text-destructive text-destructive"
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getDeleteTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
