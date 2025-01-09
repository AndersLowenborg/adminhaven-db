import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { JoinSessionForm } from '@/components/session/JoinSessionForm';
import { useParams } from 'react-router-dom';

const UserPage = () => {
  const { id: sessionIdString } = useParams();
  const sessionId = sessionIdString ? parseInt(sessionIdString) : null;
  const [answer, setAnswer] = useState('');
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch session details to verify it's active
  const { data: session, isLoading: isLoadingSession } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error('Session ID is required');
      const { data, error } = await supabase
        .from('Sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId,
  });

  // Fetch available statements
  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements', sessionId],
    queryFn: async () => {
      console.log('Fetching statements...');
      const { data, error } = await supabase
        .from('Statements')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching statements:', error);
        throw error;
      }
      
      console.log('Fetched statements:', data);
      return data;
    },
    enabled: !!sessionId,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatementId) {
      toast({
        title: "Error",
        description: "Please select a statement to answer",
        variant: "destructive",
      });
      return;
    }

    if (!answer.trim()) {
      toast({
        title: "Error",
        description: "Please enter your answer",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting answer:', { statementId: selectedStatementId, answer });

    try {
      const { data, error } = await supabase
        .from('Answers')
        .insert([{ 
          statement_id: selectedStatementId,
          content: answer 
        }])
        .select()
        .single();

      if (error) throw error;

      console.log('Answer submitted successfully:', data);
      
      toast({
        title: "Success",
        description: "Your answer has been submitted",
      });
      
      setAnswer('');
      setSelectedStatementId(null);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: "Error",
        description: "Failed to submit your answer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center text-red-500">Session not found</p>
      </div>
    );
  }

  if (session.status !== 'active') {
    return (
      <div className="container mx-auto p-8">
        <p className="text-center text-yellow-500">This session is not currently active</p>
      </div>
    );
  }

  // Show join form if session is active
  return (
    <div className="container mx-auto p-8">
      <JoinSessionForm />
      
      {isLoadingStatements ? (
        <p className="text-center mt-8">Loading statements...</p>
      ) : statements && statements.length > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-4">
            {statements.map((statement) => (
              <div 
                key={statement.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedStatementId === statement.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-primary/50'
                }`}
                onClick={() => setSelectedStatementId(statement.id)}
              >
                <p className="text-gray-800">{statement.content}</p>
              </div>
            ))}
          </div>

          {selectedStatementId && (
            <div className="space-y-2">
              <label htmlFor="answer" className="block text-sm font-medium">
                Your Answer
              </label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Enter your answer here..."
                className="min-h-[150px]"
              />
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting || !selectedStatementId}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Answer"}
          </Button>
        </form>
      ) : (
        <p className="text-center mt-8">No statements available.</p>
      )}
    </div>
  );
};

export default UserPage;