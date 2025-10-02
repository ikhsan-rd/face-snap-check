import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, logoutUser } from "@/services/api";
import { ClipboardCheck, BarChart3, LogOut } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { NotificationDialog } from "@/components/NotificationDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });
  
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
    
    try {
      if (response.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Logout Berhasil",
          message: "Anda telah logout dari sistem",
        });
        localStorage.removeItem("user_data");
        localStorage.removeItem("is_logged_in");
        navigate("/");
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Logout Gagal",
          message: response.message || "Gagal logout dari server",
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Logout Lokal",
        message: "Sesi lokal dihapus, tapi mungkin tidak tersinkronisasi dengan server.",
      });
      localStorage.removeItem("user_data");
      localStorage.removeItem("is_logged_in");
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <LoadingScreen isOpen={isLoggingOut} message="Logout..." />

      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

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
    </>
  );
};

export default Dashboard;
