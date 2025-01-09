import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

const AdminPage = () => {
  const { toast } = useToast();
  const [sessionName, setSessionName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert([
          { 
            name: sessionName.trim(),
            status: 'created',
            created_by: 'admin' // TODO: Replace with actual user ID when auth is implemented
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session created successfully",
      });
      
      console.log('Created session:', data);
      setSessionName('');
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error",
        description: "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <label htmlFor="sessionName" className="text-sm font-medium">
            Session Name
          </label>
          <Input
            id="sessionName"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name"
            disabled={isLoading}
          />
        </div>
        
        <Button 
          onClick={handleCreateSession}
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create Session"}
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;