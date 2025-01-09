import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Answer = {
  id: number;
  content: string;
  created_at: string;
  statement_id: number;
  statement: {
    content: string;
  };
};

const PresenterPage = () => {
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Fetch answers with their corresponding statements
  const { data: initialAnswers, isLoading } = useQuery({
    queryKey: ['answers'],
    queryFn: async () => {
      console.log('Fetching answers...');
      const { data, error } = await supabase
        .from('Answers')
        .select(`
          *,
          statement:Statements(content)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching answers:', error);
        throw error;
      }
      
      console.log('Fetched answers:', data);
      return data as Answer[];
    },
  });

  useEffect(() => {
    if (initialAnswers) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  // Set up real-time subscription for new answers
  useEffect(() => {
    console.log('Setting up real-time subscription for answers...');
    const channel = supabase
      .channel('answers-changes')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'Answers' 
        },
        async (payload) => {
          console.log('New answer received:', payload);
          // Fetch the complete answer data including the statement
          const { data, error } = await supabase
            .from('Answers')
            .select(`
              *,
              statement:Statements(content)
            `)
            .eq('id', payload.new.id)
            .single();

          if (error) {
            console.error('Error fetching new answer details:', error);
            return;
          }

          console.log('Fetched new answer details:', data);
          setAnswers(prev => [data as Answer, ...prev]);
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-gray-600">Loading answers...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Presenter Dashboard</h1>
      
      <div className="grid gap-4">
        {answers.length === 0 ? (
          <p className="text-gray-600 text-center">No answers submitted yet.</p>
        ) : (
          answers.map((answer) => (
            <Card key={answer.id} className="p-4 space-y-2">
              <p className="text-sm font-medium text-gray-500">Statement:</p>
              <p className="text-gray-800">{answer.statement?.content}</p>
              <div className="h-px bg-gray-200 my-3" />
              <p className="text-sm font-medium text-gray-500">Answer:</p>
              <p className="text-gray-800">{answer.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(answer.created_at).toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PresenterPage;