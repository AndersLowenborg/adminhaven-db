import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center space-y-8 p-8">
        <img 
          src="/lovable-uploads/7f867208-6c5c-4b53-aad8-f74c1fab9c89.png" 
          alt="Grousion Logo" 
          className="mx-auto w-96 h-auto"
        />
        <h1 className="text-4xl font-bold text-[#403E43]">Welcome to Grousion</h1>
        <p className="text-xl text-[#8E9196]">Empowering group discussions and decision making</p>
        <Button 
          onClick={() => navigate('/login')}
          className="bg-[#F97316] hover:bg-[#FB923C] text-white"
        >
          Enter Admin Dashboard
        </Button>
      </div>
    </div>
  );
};

export default Index;