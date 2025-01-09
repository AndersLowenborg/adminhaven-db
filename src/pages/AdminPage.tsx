import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionsList } from '@/components/admin/AdminSessionsList';
import { useCreateSession } from '@/hooks/use-create-session';

const AdminPage = () => {
  const { isLoading: isSessionLoading, session, error } = useSessionContext();
  const navigate = useNavigate();
  const createSession = useCreateSession();

  React.useEffect(() => {
    console.log('Session loading:', isSessionLoading);
    console.log('Session:', session);
    
    // Only redirect if we're done loading and there's no session
    if (!isSessionLoading && !session) {
      console.log('No active session, redirecting to login');
      navigate('/login');
      return;
    }

    if (session) {
      console.log('Active session found:', session.user.id);
    }
  }, [isSessionLoading, session, navigate]);

  // Show loading state only while session is loading
  if (isSessionLoading) {
    return <div className="text-center py-8">Loading authentication...</div>;
  }

  // If there's no session after loading, return null (redirect will handle it)
  if (!session) {
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