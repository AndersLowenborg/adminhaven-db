import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSessionsList } from '@/components/admin/AdminSessionsList';
import { useCreateSession } from '@/hooks/use-create-session';

const AdminPage = () => {
  const { isLoading, session } = useSessionContext();
  const navigate = useNavigate();
  const createSession = useCreateSession();

  console.log('Session loading:', isLoading);
  console.log('Session:', session);

  React.useEffect(() => {
    if (!isLoading && !session) {
      console.log('No active session, redirecting to login');
      navigate('/login');
    }
  }, [isLoading, session, navigate]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
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