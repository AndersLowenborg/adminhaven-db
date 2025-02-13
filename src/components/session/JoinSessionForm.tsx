
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const JoinSessionForm = () => {
  const { id } = useParams();
  const [name, setName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !id) return;

    setIsJoining(true);
    try {
      // First check if name already exists in session
      const { data: existingUser, error: checkError } = await supabase
        .from('SESSION_USERS')
        .select('id')
        .eq('session_id', parseInt(id))
        .eq('name', name.trim())
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingUser) {
        throw new Error('This name is already taken in this session. Please choose a different name.');
      }

      console.log('Attempting to join session:', { sessionId: id, name });
      const { error } = await supabase
        .from('SESSION_USERS')
        .insert({
          id: Date.now(), // Generate a unique ID
          session_id: parseInt(id),
          name: name.trim()
        });

      if (error) throw error;

      // Store the user's name in localStorage for this session
      localStorage.setItem(`session_${id}_name`, name.trim());

      toast({
        title: "Success",
        description: "You've joined the session successfully",
      });
      
      setHasJoined(true);
    } catch (error) {
      console.error('Error joining session:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join session",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (hasJoined) {
    return (
      <div className="text-center space-y-4 max-w-md mx-auto mt-8">
        <h2 className="text-2xl font-bold">Welcome {name}!</h2>
        <p className="text-gray-600">Waiting for admin to start the session...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Join Session</h2>
        <Input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isJoining || !name.trim()}
        className="w-full"
      >
        {isJoining ? "Joining..." : "Join Session"}
      </Button>
    </form>
  );
};
