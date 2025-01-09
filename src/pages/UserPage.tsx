import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const UserPage = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter your statement",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting statement:', content);

    try {
      const { data, error } = await supabase
        .from('Statements')
        .insert([{ content }])
        .select()
        .single();

      if (error) throw error;

      console.log('Statement submitted successfully:', data);
      
      toast({
        title: "Success",
        description: "Your statement has been submitted",
      });
      
      setContent('');
    } catch (error) {
      console.error('Error submitting statement:', error);
      toast({
        title: "Error",
        description: "Failed to submit your statement. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Submit Your Statement</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="statement" className="block text-sm font-medium">
            Your Statement
          </label>
          <Textarea
            id="statement"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your statement here..."
            className="min-h-[150px]"
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? "Submitting..." : "Submit Statement"}
        </Button>
      </form>
    </div>
  );
};

export default UserPage;