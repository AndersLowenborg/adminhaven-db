import { Button } from "@/components/ui/button";
import { Statement } from "@/types/statement";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  PlayIcon,
  PauseIcon,
  LineChartIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  UsersRoundIcon,
  LockIcon
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStatementVisibility } from "@/hooks/use-statement-visibility";
import { GroupPreparation } from "./GroupPreparation";
import { supabase } from "@/integrations/supabase/client";

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
  const [groupPreparationData, setGroupPreparationData] = useState<{ participants: any[], answers: any[] } | null>(null);
  const [currentRound, setCurrentRound] = useState<number | null>(null);
  const [currentRoundStatus, setCurrentRoundStatus] = useState<string | null>(null);
  
  const canDeleteStatements = sessionStatus === 'UNPUBLISHED';

  useEffect(() => {
    const fetchCurrentRound = async () => {
      console.log('Fetching current round for session:', sessionId);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.error('Error fetching session:', sessionError);
        return;
      }

      console.log('Session data:', sessionData);

      if (sessionData.has_active_round) {
        const { data: roundData, error: roundError } = await supabase
          .from('ROUND')
          .select('round_number, status, statement_id')
          .eq('id', sessionData.has_active_round)
          .single();

        if (roundError) {
          console.error('Error fetching round:', roundError);
          return;
        }

        console.log('Round data:', roundData);
        setCurrentRound(roundData.round_number);
        setCurrentRoundStatus(roundData.status);
      } else {
        setCurrentRound(null);
        setCurrentRoundStatus(null);
      }
    };

    fetchCurrentRound();
  }, [sessionId, activeRounds]);

  const canPrepareGroups = (statementId: number) => {
    console.log('Checking canPrepareGroups for statement:', statementId);
    console.log('Active rounds:', activeRounds);
    
    // Check if there's any active round that's in Round 2 or higher
    const hasLaterRounds = activeRounds?.some(round => 
      round.statement_id === statementId && 
      round.round_number > 1
    );

    if (hasLaterRounds) {
      return false;
    }
    
    const round = activeRounds?.find(round => 
      round.statement_id === statementId && 
      round.status === 'LOCKED' &&
      round.round_number === 1
    );
    
    console.log('Found round:', round);
    return !!round;
  };

  const handleGroupPreparation = async (statementId: number) => {
    console.log('Preparing groups for statement:', statementId);
    
    try {
      const { data: roundData, error: roundError } = await supabase
        .from('ROUND')
        .select('*')
        .eq('statement_id', statementId)
        .single();

      if (roundError) throw roundError;

      const { data: answers, error: answersError } = await supabase
        .from('ANSWER')
        .select('*')
        .eq('round_id', roundData.id);

      if (answersError) throw answersError;

      const { data: participants, error: participantsError } = await supabase
        .from('SESSION_USERS')
        .select('*')
        .eq('session_id', sessionId);

      if (participantsError) throw participantsError;

      console.log('Round data:', roundData);
      console.log('Answers:', answers);
      console.log('Participants:', participants);

      setGroupPreparationData({ participants, answers });

      await onStartRound(statementId);

      toast({
        title: "Groups Prepared",
        description: "Groups have been formed and next round created.",
      });

    } catch (error) {
      console.error('Error preparing groups:', error);
      toast({
        title: "Error",
        description: "Failed to prepare groups",
        variant: "destructive",
      });
    }
  };

  const handleToggleResults = (statementId: number) => {
    toggleVisibility(statementId);
    
    const isCurrentlyShowing = visibleResults.includes(statementId);
    toast({
      title: "Success",
      description: `Results ${!isCurrentlyShowing ? 'shown' : 'hidden'} for this statement`,
    });
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
          const activeRound = activeRounds?.find(
            round => round.statement_id === statement.id
          );
          
          console.log('Active round for statement', statement.id, ':', activeRound);
          
          const isRoundLocked = activeRound?.status === 'LOCKED';
          const isRoundStarted = activeRound?.status === 'STARTED';
          const isShowingResults = visibleResults.includes(statement.id);
          const canStartPrepareGroups = canPrepareGroups(statement.id);

          const isPlayButtonEnabled = sessionStatus === 'STARTED' && 
            (!activeRound || 
             currentRoundStatus === 'NOT_STARTED' || 
             (isRoundLocked && currentRound !== null));

          const isLockButtonEnabled = isRoundStarted;

          return (
            <Card key={statement.id} className="p-6">
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
                  <div className="flex items-center gap-2 ml-auto">
                    {isRoundStarted ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEndRound(statement.id)}
                        disabled={!isLockButtonEnabled}
                        className="hover:bg-orange-50 hover:text-orange-600 text-orange-500"
                      >
                        <LockIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onStartRound(statement.id)}
                        disabled={!isPlayButtonEnabled}
                        className="hover:bg-orange-50 hover:text-orange-600"
                      >
                        <PlayIcon className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleGroupPreparation(statement.id)}
                      disabled={!canStartPrepareGroups}
                      className={`hover:bg-orange-50 hover:text-orange-600 ${canStartPrepareGroups ? "" : "text-orange-500"}`}
                    >
                      <UsersRoundIcon className="h-4 w-4" />
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
                      onClick={() => onUpdateStatement(statement.id, statement.statement || '', statement.description || '')}
                      disabled={!!activeRound || sessionStatus === 'ENDED'}
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
              </div>
            </Card>
          );
        })}
      </div>

      {groupPreparationData && (
        <div className="mt-8">
          <GroupPreparation 
            participants={groupPreparationData.participants}
            answers={groupPreparationData.answers}
          />
        </div>
      )}
    </div>
  );
};
