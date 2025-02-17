
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from '@/integrations/supabase/client';
import { WaitingPage } from './WaitingPage';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface UserResponseFormProps {
  statement: {
    id: number;
    content: string;
    status: string;
  };
  onSubmit: () => void;
}

export const UserResponseForm = ({ statement, onSubmit }: UserResponseFormProps) => {
  const [agreementLevel, setAgreementLevel] = React.useState(5);
  const [confidenceLevel, setConfidenceLevel] = React.useState(5);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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
        .select('id')
        .eq('statement_id', statement.id)
        .eq('status', 'STARTED')
        .single();

      if (roundError) throw roundError;

      // Get the user's session_user record
      const { data: userData, error: userError } = await supabase
        .from('SESSION_USERS')
        .select('id')
        .eq('session_id', sessionId)
        .eq('name', storedName)
        .single();

      if (userError) throw userError;

      // Submit the answer
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

  if (isSubmitted) {
    return <WaitingPage />;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">{statement.content}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
              disabled={isSubmitting || statement.status !== 'STARTED'}
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
              disabled={isSubmitting || statement.status !== 'STARTED'}
            />
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={isSubmitting || statement.status !== 'STARTED'}
        >
          {isSubmitting ? "Submitting..." : 
           statement.status !== 'STARTED' ? "Waiting for admin to activate statement" : 
           "Submit Response"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default UserResponseForm;
