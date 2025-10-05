import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginModal } from "@/components/LoginModal";
import { getCurrentUser } from "@/services/api";

const Login = () => {
  const navigate = useNavigate();
  const [loginModalOpen, setLoginModalOpen] = useState(true);
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Jika sudah login, redirect ke dashboard
    if (currentUser) {
      navigate("/");
    } else {
      // Buka login modal
      setLoginModalOpen(true);
    }
  }, [currentUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20">
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => navigate("/")}
        onLogin={() => {
          navigate("/");
        }}
      />
    </div>
  );
};

export default Login;
