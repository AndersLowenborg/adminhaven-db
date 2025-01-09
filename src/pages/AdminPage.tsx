import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const AdminPage = () => {
  const { toast } = useToast();
  const [sessionName, setSessionName] = React.useState('');

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a session name",
        variant: "destructive",
      });
      return;
    }
    
    // TODO: Implement session creation with Supabase
    toast({
      title: "Success",
      description: "Session created successfully",
    });
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
          />
        </div>
        
        <Button onClick={handleCreateSession}>
          Create Session
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;