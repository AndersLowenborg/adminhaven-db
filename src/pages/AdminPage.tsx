import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionsView } from '@/components/admin/AdminSessionsView';

const AdminPage = () => {
  const user = useUser();
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      console.log('Checking authentication status...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session found, redirecting to login');
        navigate('/login');
      }
    };
    
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (!user) {
    return (
      <div className="container mx-auto p-8 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <AdminHeader />
      <AdminSessionsView />
    </div>
  );
};

export default AdminPage;