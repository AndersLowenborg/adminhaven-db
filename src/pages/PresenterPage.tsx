import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Statement = Database['public']['Tables']['Statements']['Row'];

const PresenterPage = () => {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatements = async () => {
      console.log('Fetching statements...');
      try {
        const { data, error } = await supabase
          .from('Statements')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        console.log('Fetched statements:', data);
        setStatements(data || []);
      } catch (error) {
        console.error('Error fetching statements:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatements();

    // Set up real-time subscription
    const subscription = supabase
      .channel('statements-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'Statements' 
        }, 
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchStatements();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p className="text-gray-600">Loading statements...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Presenter Dashboard</h1>
      
      <div className="grid gap-4">
        {statements.length === 0 ? (
          <p className="text-gray-600 text-center">No statements submitted yet.</p>
        ) : (
          statements.map((statement) => (
            <Card key={statement.id} className="p-4">
              <p className="text-gray-800">{statement.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(statement.created_at || '').toLocaleString()}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PresenterPage;