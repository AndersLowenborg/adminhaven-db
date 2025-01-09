import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useSessionContext } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionsList } from '@/components/admin/AdminSessionsList';
import { useCreateSession } from '@/hooks/use-create-session';

const AdminPage = () => {
  const { isLoading: isSessionLoading, session } = useSessionContext();
  const user = useUser();
  const navigate = useNavigate();
  const createSession = useCreateSession();

  React.useEffect(() => {
    console.log('Session loading:', isSessionLoading);
    console.log('Session:', session);
    console.log('User:', user);
    
    if (!isSessionLoading && !session) {
      console.log('No active session found, redirecting to login');
      navigate('/login');
    }
  }, [isSessionLoading, session, navigate]);

  if (isSessionLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!session || !user) {
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