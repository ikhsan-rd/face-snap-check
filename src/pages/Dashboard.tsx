import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClipboardCheck, BarChart3, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, logoutUser } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleLogout = async () => {
    if (!currentUser) return;
    
    setIsLoggingOut(true);
    const response = await logoutUser(currentUser.id);
    
    if (response.success) {
      toast({
        title: "Berhasil",
        description: "Logout berhasil",
      });
      navigate("/");
    } else {
      // Even if backend logout fails (e.g., UUID deleted from spreadsheet),
      // we should still clear local session for user safety
      localStorage.removeItem("user_data");
      localStorage.removeItem("is_logged_in");
      
      toast({
        title: "Logout Lokal",
        description: "Sesi lokal telah dibersihkan. Data di server mungkin sudah tidak sinkron.",
        variant: "default",
      });
      navigate("/");
    }
    setIsLoggingOut(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Selamat datang kembali!</p>
          </div>
          <Button variant="ghost" onClick={handleLogout} disabled={isLoggingOut}>
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Presensi</h2>
                <p className="text-muted-foreground">Lakukan presensi harian</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/overview")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-secondary/10 rounded-full">
                <BarChart3 className="h-8 w-8 text-secondary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Overview</h2>
                <p className="text-muted-foreground">Lihat riwayat presensi</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;