import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const UserPage = () => {
  const { toast } = useToast();
  const [userName, setUserName] = React.useState('');

  const handleJoinSession = () => {
    if (!userName.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    // TODO: Implement session joining with Supabase
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Join Session</h1>
      
      <div className="max-w-md space-y-4">
        <div className="space-y-2">
          <label htmlFor="userName" className="text-sm font-medium">
            Your Name
          </label>
          <Input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>
        
        <Button onClick={handleJoinSession}>
          Join Session
        </Button>
      </div>
    </div>
  );
};

export default UserPage;