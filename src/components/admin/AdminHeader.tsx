
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSupabaseSession } from "@/hooks/use-session";

export const AdminHeader = () => {
  const navigate = useNavigate();
  const { session } = useSupabaseSession();

  const handleLogout = async () => {
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between p-8 bg-white border-b">
      <div className="flex items-center gap-4">
        <img
          src="/lovable-uploads/853e4d3d-589f-4424-8dd4-42d013e54554.png"
          alt="Grousion Logo"
          className="h-12 w-auto"
        />
        <h1 className="text-3xl font-bold text-[#403E43]">Admin Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <p className="text-sm text-[#8E9196]">
          {session?.user?.email}
        </p>
        <Button variant="ghost" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </div>
  );
};
