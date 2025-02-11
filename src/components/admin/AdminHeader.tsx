
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
    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex items-center gap-4">
        <img 
          src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
          alt="Grousion Logo" 
          className="h-12 w-auto"
        />
        <h1 className="text-2xl font-bold text-[#403E43]">Admin Dashboard</h1>
      </div>
      <Button 
        variant="outline" 
        onClick={handleLogout}
        className="border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white transition-colors"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );
};
