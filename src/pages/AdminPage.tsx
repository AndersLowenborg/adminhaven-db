import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useSessionContext } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionsList } from '@/components/admin/AdminSessionsList';
import { useCreateSession } from '@/hooks/use-create-session';

const AdminPage = () => {
  const { isLoading: isSessionLoading } = useSessionContext();
  const user = useUser();
  const navigate = useNavigate();
  const createSession = useCreateSession();

  // Check authentication and redirect if not logged in
  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication status...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (!session) {
        console.log('No active session found, redirecting to login');
        navigate('/login');
        return;
      }
      console.log('Active session found for user:', session.user.id);
    };
    
    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, 'Session:', session?.user?.id);
      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out or session expired, redirecting to login');
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (isSessionLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!user) {
    console.log('No user found after session load, redirecting to login');
    navigate('/login');
    return null;
  }

  return (
    <div className="container mx-auto p-8">
      <AdminHeader />
      <div className="flex justify-end mb-8">
        <Button onClick={createSession}>Create New Session</Button>
      </div>
      <AdminSessionsList />
    </div>
  );
};

export default AdminPage;