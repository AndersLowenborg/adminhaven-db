
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from '@/integrations/supabase/client';
import { WaitingPage } from './WaitingPage';
import { StatementTimer } from './StatementTimer';
import { useQueryClient } from '@tanstack/react-query';

interface UserResponseFormProps {
  statement: {
    id: number;
    content: string;
    status: string;
    timer_seconds?: number;
    timer_started_at?: string;
    timer_status?: string;
  };
  onSubmit: () => void;
}

export const UserResponseForm = ({ statement, onSubmit }: UserResponseFormProps) => {
  const [agreementLevel, setAgreementLevel] = React.useState(5);
  const [confidenceLevel, setConfidenceLevel] = React.useState(5);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const queryClient = useQueryClient();

  // Set up real-time subscription for statement updates
  useEffect(() => {
    if (!statement.id) return;

    const channel = supabase
      .channel(`statement-${statement.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Statements',
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
    
    if (statement.status === 'locked') {
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
      // First, get the session_user_id
      const { data: userData, error: userError } = await supabase
        .from('SessionUsers')
        .select('id')
        .eq('session_id', sessionId)
        .eq('name', storedName)
        .single();

      if (userError) throw userError;

      // Then submit the answer with the session_user_id
      const { error } = await supabase
        .from('Answers')
        .insert([
          {
            statement_id: statement.id,
            session_user_id: userData.id,
            agreement_level: agreementLevel,
            confidence_level: confidenceLevel,
            content: `Agreement: ${agreementLevel}/10, Confidence: ${confidenceLevel}/10`
          }
        ]);

      if (error) throw error;
      
      setIsSubmitted(true);
      onSubmit();
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return <WaitingPage />;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <StatementTimer 
        timerSeconds={statement.timer_seconds}
        timerStartedAt={statement.timer_started_at}
        timerStatus={statement.timer_status}
      />
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
              disabled={isSubmitting || statement.status === 'locked'}
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
              disabled={isSubmitting || statement.status === 'locked'}
            />
          </div>
        </div>

        <Button 
          onClick={handleSubmit} 
          className="w-full"
          disabled={isSubmitting || statement.status === 'locked'}
        >
          {isSubmitting ? "Submitting..." : statement.status === 'locked' ? "Statement Locked" : "Submit Response"}
        </Button>
      </CardContent>
    </Card>
  );
};
