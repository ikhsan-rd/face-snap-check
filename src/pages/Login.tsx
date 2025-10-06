import { LoginModal } from "@/components/LoginModal";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background flex items-center justify-center p-4">
      <LoginModal 
        isOpen={true} 
        onClose={() => navigate("/")}
        onLogin={() => navigate("/")}
      />
    </div>
  );
};

export default Login;
