
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface UserResponseFormProps {
  statement: {
    id: number;
    content: string;
    status: string;
  };
  onSubmit: () => void;
  participantId?: number;
}

export const UserResponseForm = ({ statement, onSubmit, participantId }: UserResponseFormProps) => {
  const [agreementLevel, setAgreementLevel] = React.useState(5);
  const [confidenceLevel, setConfidenceLevel] = React.useState(5);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (isSubmitting || !participantId) return;
    
    if (statement.status === 'locked') {
      toast({
        title: "Error",
        description: "This statement is locked and cannot receive new responses",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('Answers')
        .insert([
          {
            statement_id: statement.id,
            participant_id: participantId,
            agreement_level: agreementLevel,
            confidence_level: confidenceLevel,
            content: `Agreement: ${agreementLevel}/10, Confidence: ${confidenceLevel}/10`
          }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique violation error code
          toast({
            title: "Error",
            description: "You have already submitted a response for this statement",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Success",
        description: "Response submitted successfully",
      });
      
      onSubmit();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
          disabled={isSubmitting || statement.status === 'locked' || !participantId}
        >
          {isSubmitting ? "Submitting..." : !participantId ? "Please join session first" : statement.status === 'locked' ? "Statement Locked" : "Submit Response"}
        </Button>
      </CardContent>
    </Card>
  );
};
