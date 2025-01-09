import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionsView } from '@/components/admin/AdminSessionsView';

const AdminPage = () => {
  const user = useUser();
  const navigate = useNavigate();

  // Check authentication and redirect if not logged in
  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication status...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (!session) {
        console.log('No active session found, redirecting to login');
        navigate('/login');
      } else {
        console.log('Active session found for user:', session.user.id);
      }
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

  // Only render content if user is authenticated
  if (!user) {
    console.log('No user found, rendering null');
    return null;
  }

  console.log('Rendering AdminPage for user:', user.id);
  return (
    <div className="container mx-auto p-8">
      <AdminHeader />
      <AdminSessionsView />
    </div>
  );
};

export default AdminPage;