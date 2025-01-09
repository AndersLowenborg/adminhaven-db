import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const UserPage = () => {
  const [answer, setAnswer] = useState('');
  const [selectedStatementId, setSelectedStatementId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch available statements
  const { data: statements, isLoading: isLoadingStatements } = useQuery({
    queryKey: ['statements'],
    queryFn: async () => {
      console.log('Fetching statements...');
      const { data, error } = await supabase
        .from('Statements')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching statements:', error);
        throw error;
      }
      
      console.log('Fetched statements:', data);
      return data;
    },
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

  if (isLoadingStatements) {
    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <p className="text-center text-gray-500">Loading statements...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Submit Your Answer</h1>
      
      {statements && statements.length > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-6">
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
        <p className="text-center text-gray-500">No statements available.</p>
      )}
    </div>
  );
};

export default UserPage;