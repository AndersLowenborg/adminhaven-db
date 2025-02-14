
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const SessionHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-4 mb-8">
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="mr-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin
      </Button>
      <img 
        src="/lovable-uploads/853e4d3d-589f-4424-8dd4-42d013e54554.png" 
        alt="Grousion Logo" 
        className="h-12 w-auto"
      />
      <h1 className="text-2xl font-bold text-[#403E43]">Session Management</h1>
    </div>
  );
};
