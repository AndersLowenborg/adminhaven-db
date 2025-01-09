import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AdminHeader = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <Button variant="outline" onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};