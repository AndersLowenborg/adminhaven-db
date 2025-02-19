import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from '@/integrations/supabase/client';
import { WaitingPage } from './WaitingPage';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserResponseFormProps {
  statement: {
    id: number;
    content: string;
    status: string;
  };
  onSubmit: () => void;
  groupData?: {
    isLeader: boolean;
    groupMembers: { name: string }[];
  };
}

export const UserResponseForm = ({ statement, onSubmit, groupData }: UserResponseFormProps) => {
  const [agreementLevel, setAgreementLevel] = React.useState(5);
  const [confidenceLevel, setConfidenceLevel] = React.useState(5);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const checkExistingAnswer = async () => {
      console.log("Checking existing answer for group data:", groupData);
      const sessionIdString = window.location.pathname.split('/').pop();
      const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
      
      if (!sessionId || !statement.id) return;

      try {
        // Get the active round
        const { data: activeRound, error: roundError } = await supabase
          .from('ROUND')
          .select('id')
          .eq('statement_id', statement.id)
          .eq('status', 'STARTED')
          .maybeSingle();

        if (roundError) {
          console.error('Error fetching active round:', roundError);
          return;
        }

        if (!activeRound) {
          console.log('No active round found');
          return;
        }

        console.log('Active round found:', activeRound);

        if (groupData?.isLeader) {
          console.log('Checking group leader answer');
          // Check for existing group answer
          const { data: roundGroup, error: groupError } = await supabase
            .from('ROUND_GROUPS')
            .select('groups_id')
            .eq('round_id', activeRound.id)
            .maybeSingle();

          if (groupError) {
            console.error('Error fetching round group:', groupError);
            return;
          }

          if (!roundGroup) {
            console.log('No round group found');
            return;
          }

          console.log('Round group found:', roundGroup);

          const { data: existingAnswer, error: answerError } = await supabase
            .from('ANSWER')
            .select('id')
            .eq('round_id', activeRound.id)
            .eq('respondant_type', 'GROUP')
            .eq('respondant_id', roundGroup.groups_id)
            .maybeSingle();

          if (answerError) {
            console.error('Error fetching existing answer:', answerError);
            return;
          }

          console.log('Existing group answer:', existingAnswer);
          setHasSubmitted(!!existingAnswer);
        } else {
          console.log('Checking individual answer');
          // Check for existing individual answer
          const storedName = localStorage.getItem(`session_${sessionId}_name`);
          const { data: userData, error: userError } = await supabase
            .from('SESSION_USERS')
            .select('id')
            .eq('session_id', sessionId)
            .eq('name', storedName)
            .maybeSingle();

          if (userError) {
            console.error('Error fetching user data:', userError);
            return;
          }

          if (!userData) {
            console.log('No user data found');
            return;
          }

          console.log('User data found:', userData);

          const { data: existingAnswer, error: answerError } = await supabase
            .from('ANSWER')
            .select('id')
            .eq('round_id', activeRound.id)
            .eq('respondant_type', 'SESSION_USER')
            .eq('respondant_id', userData.id)
            .maybeSingle();

          if (answerError) {
            console.error('Error fetching existing answer:', answerError);
            return;
          }

          console.log('Existing individual answer:', existingAnswer);
          setHasSubmitted(!!existingAnswer);
        }
      } catch (error) {
        console.error('Error in checkExistingAnswer:', error);
      }
    };

    checkExistingAnswer();
  }, [statement.id, groupData]);

  useEffect(() => {
    if (!statement.id) return;

    const channel = supabase
      .channel(`statement-${statement.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'STATEMENT',
          filter: `id=eq.${statement.id}`,
        },
        (payload) => {
          console.log('Statement update received:', payload);
          queryClient.invalidateQueries({ queryKey: ['statements'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [statement.id, queryClient]);

  const handleConfirmSubmit = () => {
    setShowConfirmDialog(true);
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    console.log('Current state:', {
      isSubmitting,
      hasSubmitted,
      statement,
      groupData
    });

    if (isSubmitting || hasSubmitted) {
      console.log('Preventing submit - already submitting or has submitted');
      return;
    }
    
    if (statement.status !== 'STARTED') {
      console.log('Preventing submit - statement not started');
      return;
    }

    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const sessionIdString = window.location.pathname.split('/').pop();
    const sessionId = sessionIdString ? parseInt(sessionIdString) : null;

    if (!sessionId) {
      console.error('Invalid session ID');
      return;
    }

    try {
      console.log('Starting submission process');
      // First check if the session still has an active round
      const { data: sessionData, error: sessionError } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .maybeSingle();

      if (sessionError) {
        console.error('Session fetch error:', sessionError);
        throw sessionError;
      }

      if (!sessionData?.has_active_round) {
        console.log('No active round in session');
        setRoundEnded(true);
        toast({
          title: "Round Ended",
          description: "The round has ended. Please wait for the next round.",
          variant: "destructive"
        });
        return;
      }

      console.log('Found active round:', sessionData.has_active_round);

      // Get the active round for this statement
      const { data: activeRound, error: roundError } = await supabase
        .from('ROUND')
        .select('id, respondant_type')
        .eq('statement_id', statement.id)
        .eq('status', 'STARTED')
        .maybeSingle();

      if (roundError) {
        console.error('Round fetch error:', roundError);
        throw roundError;
      }

      if (!activeRound) {
        console.error('No active round found');
        throw new Error('No active round found');
      }

      console.log('Active round details:', activeRound);

      if (groupData?.isLeader) {
        console.log('Submitting as group leader');
        // For group leaders, we need to get the group ID from ROUND_GROUPS
        const { data: roundGroup, error: roundGroupError } = await supabase
          .from('ROUND_GROUPS')
          .select('groups_id')
          .eq('round_id', activeRound.id)
          .maybeSingle();

        if (roundGroupError) {
          console.error('Round group fetch error:', roundGroupError);
          throw roundGroupError;
        }

        if (!roundGroup) {
          console.error('No round group found');
          throw new Error('No round group found');
        }

        console.log('Found round group:', roundGroup);

        const { error: answerError } = await supabase
          .from('ANSWER')
          .insert({
            agreement_level: agreementLevel,
            confidence_level: confidenceLevel,
            respondant_type: 'GROUP',
            respondant_id: roundGroup.groups_id,
            round_id: activeRound.id
          });

        if (answerError) {
          console.error('Answer insert error:', answerError);
          throw answerError;
        }

        console.log('Successfully submitted group answer');
      } else {
        console.log('Submitting as individual');
        const storedName = localStorage.getItem(`session_${sessionId}_name`);
        // For individual responses
        const { data: userData, error: userError } = await supabase
          .from('SESSION_USERS')
          .select('id')
          .eq('session_id', sessionId)
          .eq('name', storedName)
          .maybeSingle();

        if (userError) {
          console.error('User data fetch error:', userError);
          throw userError;
        }

        if (!userData) {
          console.error('No user data found');
          throw new Error('No user data found');
        }

        console.log('Found user data:', userData);

        const { error: answerError } = await supabase
          .from('ANSWER')
          .insert({
            agreement_level: agreementLevel,
            confidence_level: confidenceLevel,
            respondant_type: 'SESSION_USER',
            respondant_id: userData.id,
            round_id: activeRound.id
          });

        if (answerError) {
          console.error('Answer insert error:', answerError);
          throw answerError;
        }

        console.log('Successfully submitted individual answer');
      }
      
      toast({
        title: "Success",
        description: "Your response has been submitted",
      });
      
      setHasSubmitted(true);
      onSubmit();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit your response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if already submitted, show waiting page
  if (hasSubmitted) {
    return <WaitingPage />;
  }

  // Show group member view if user is in a group but not the leader
  if (groupData && !groupData.isLeader) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">{statement.content}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
            <Users2 className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-600">Group Discussion Required</AlertTitle>
            <AlertDescription>
              Agree with the members of your group. The group leader will submit the answer.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">{statement.content}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {roundEnded && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Round Ended</AlertTitle>
              <AlertDescription>
                This statement has been closed by the administrator. Please wait for the next round.
              </AlertDescription>
            </Alert>
          )}
          
          {groupData?.isLeader && (
            <Alert className="bg-orange-50 border-orange-200 mb-4">
              <Users2 className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-600">You are the Group Leader</AlertTitle>
              <AlertDescription>
                As the group leader, you are responsible for submitting the answer on behalf of your group.
                Please discuss with your team members before submitting.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Agreement Level: {agreementLevel}/10
              </label>
              <Slider
                value={[agreementLevel]}
                onValueChange={(value) => setAgreementLevel(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
                disabled={isSubmitting || statement.status !== 'STARTED' || roundEnded}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Confidence Level: {confidenceLevel}/10
              </label>
              <Slider
                value={[confidenceLevel]}
                onValueChange={(value) => setConfidenceLevel(value[0])}
                min={1}
                max={10}
                step={1}
                className="w-full"
                disabled={isSubmitting || statement.status !== 'STARTED' || roundEnded}
              />
            </div>
          </div>

          <Button 
            onClick={handleConfirmSubmit}
            className="w-full"
            disabled={isSubmitting || statement.status !== 'STARTED' || roundEnded}
          >
            {isSubmitting ? "Submitting..." : 
             roundEnded ? "Round Ended" :
             statement.status !== 'STARTED' ? "Waiting for admin to activate statement" : 
             "Submit Response"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Submission</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your response?
              {groupData?.isLeader 
                ? " This will submit the response for your entire group."
                : ""
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserResponseForm;
