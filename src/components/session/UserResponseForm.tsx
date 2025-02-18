
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [roundEnded, setRoundEnded] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (statement.status !== 'STARTED') {
      return;
    }

    const sessionIdString = window.location.pathname.split('/').pop();
    const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
    const storedName = localStorage.getItem(`session_${sessionId}_name`);

    if (!sessionId) {
      console.error('Invalid session ID');
      return;
    }

    setIsSubmitting(true);
    try {
      // First check if the session still has an active round
      const { data: sessionData, error: sessionError } = await supabase
        .from('SESSION')
        .select('has_active_round')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      if (!sessionData.has_active_round) {
        setRoundEnded(true);
        toast({
          title: "Round Ended",
          description: "The round has ended. Please wait for the next round.",
          variant: "destructive"
        });
        return;
      }

      // Get the active round for this statement
      const { data: activeRound, error: roundError } = await supabase
        .from('ROUND')
        .select('id, round_number')
        .eq('statement_id', statement.id)
        .eq('status', 'STARTED')
        .single();

      if (roundError) throw roundError;

      if (activeRound.round_number === 1 || !groupData?.isLeader) {
        // For round 1 or non-leaders, save as individual response
        const { data: userData, error: userError } = await supabase
          .from('SESSION_USERS')
          .select('id')
          .eq('session_id', sessionId)
          .eq('name', storedName)
          .single();

        if (userError) throw userError;

        const { error: answerError } = await supabase
          .from('ANSWER')
          .insert({
            agreement_level: agreementLevel,
            confidence_level: confidenceLevel,
            respondant_type: 'SESSION_USER',
            respondant_id: userData.id,
            round_id: activeRound.id
          });

        if (answerError) throw answerError;
      } else {
        // For round 2+ and group leader, save as group response
        // First get the group ID for this round
        const { data: roundGroup, error: roundGroupError } = await supabase
          .from('ROUND_GROUPS')
          .select('groups_id')
          .eq('round_id', activeRound.id)
          .single();

        if (roundGroupError) throw roundGroupError;

        const { error: answerError } = await supabase
          .from('ANSWER')
          .insert({
            agreement_level: agreementLevel,
            confidence_level: confidenceLevel,
            respondant_type: 'GROUP',
            respondant_id: roundGroup.groups_id,
            round_id: activeRound.id
          });

        if (answerError) throw answerError;
      }
      
      toast({
        title: "Success",
        description: "Your response has been submitted",
      });
      
      setIsSubmitted(true);
      onSubmit();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit your response",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if already submitted, show waiting page
  if (isSubmitted) {
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
          onClick={handleSubmit} 
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
  );
};

export default UserResponseForm;
