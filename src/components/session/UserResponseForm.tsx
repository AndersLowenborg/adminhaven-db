
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from '@/integrations/supabase/client';
import { WaitingPage } from './WaitingPage';

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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    if (statement.status === 'locked') {
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('Answers')
        .insert([
          {
            statement_id: statement.id,
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
