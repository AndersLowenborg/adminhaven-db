
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Session } from "@/types/session";
import { useQueryClient, UseMutateFunction } from "@tanstack/react-query";

interface SessionHeaderProps {
  name: string;
  status: string;
  sessionId: number;
  onUpdateName: UseMutateFunction<Session, Error, string, unknown>;
  onStatusChange: () => void;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  name,
  status,
  sessionId,
  onUpdateName,
  onStatusChange,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <div>
      <div className="mb-4">
        <Button
          variant="ghost"
          asChild
          className="mb-4"
        >
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Link>
        </Button>
      </div>
      
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <img 
            src="/lovable-uploads/8d75e7fa-b26c-4754-875c-9846105ff72b.png" 
            alt="Grousion Logo" 
            className="w-48 h-auto"
          />
          <h1 className="text-2xl font-bold text-[#403E43]">Session Management</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            window.open(`/presenter/${sessionId}`, '_blank');
          }}
        >
          Open Presenter View
        </Button>
      </div>
    </div>
  );
};
