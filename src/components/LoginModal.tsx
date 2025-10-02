import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cekUser, registerUser, loginUser } from "@/services/api";
import { LoadingScreen } from "./LoadingScreen";
import { NotificationDialog } from "./NotificationDialog";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (credentials: { email: string; password: string }) => void;
}

export const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    id: "",
    password: "",
  });
  const [signupData, setSignupData] = useState({
    id: "",
    password: "",
  });
  const [idExists, setIdExists] = useState<boolean | null>(null);
  const [foundUserData, setFoundUserData] = useState<{ nama: string; departemen: string } | null>(null);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const response = await loginUser(credentials.id, credentials.password);
      
      if (response.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Login Berhasil",
          message: `Selamat datang, ${response.data?.nama}!`,
        });
        onLogin({ email: credentials.id, password: credentials.password });
        setCredentials({ id: "", password: "" });
        onClose();
        navigate("/overview");
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Login Gagal",
          message: response.message,
        });
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Terjadi kesalahan saat login",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleCheckId = async () => {
    if (!signupData.id.trim()) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Masukkan ID terlebih dahulu",
      });
      return;
    }

    setIsCheckingId(true);
    
    try {
      const response = await cekUser(signupData.id);
      
      if (response.success && response.data?.exists) {
        setIdExists(true);
        setFoundUserData({
          nama: response.data.nama,
          departemen: response.data.departemen
        });
        setNotification({
          isOpen: true,
          type: "success",
          title: "ID Ditemukan",
          message: `ID ${signupData.id} ditemukan untuk ${response.data.nama}`,
        });
      } else {
        setIdExists(false);
        setFoundUserData(null);
        setNotification({
          isOpen: true,
          type: "error",
          title: "ID Tidak Ditemukan",
          message: "ID tidak terdaftar dalam sistem",
        });
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Terjadi kesalahan saat mengecek ID",
      });
    } finally {
      setIsCheckingId(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    
    try {
      const response = await registerUser(signupData.id, signupData.password);
      
      if (response.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Registrasi Berhasil",
          message: "Password berhasil disimpan",
        });
        
        // Auto login after successful registration
        const loginResponse = await loginUser(signupData.id, signupData.password);
        if (loginResponse.success) {
          onLogin({ email: signupData.id, password: signupData.password });
          setSignupData({ id: "", password: "" });
          setIdExists(null);
          setFoundUserData(null);
          onClose();
          navigate("/overview");
        }
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Registrasi Gagal",
          message: response.message,
        });
      }
    } catch (error) {
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Terjadi kesalahan saat registrasi",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <LoadingScreen
        isOpen={isCheckingId || isLoggingIn || isRegistering}
        message={
          isCheckingId
            ? "Mengecek ID..."
            : isLoggingIn
            ? "Login..."
            : "Menyimpan data..."
        }
      />

      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Akses Dashboard</DialogTitle>
          <DialogDescription>
            Login atau daftar untuk mengakses dashboard presensi
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="id">ID</Label>
                <Input
                  id="id"
                  type="text"
                  placeholder="Masukkan ID"
                  value={credentials.id}
                  onChange={(e) =>
                    setCredentials({ ...credentials, id: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={credentials.password}
                    onChange={(e) =>
                      setCredentials({ ...credentials, password: e.target.value })
                    }
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Batal
                </Button>
                <Button type="submit" className="flex-1" disabled={isLoggingIn}>
                  {isLoggingIn ? "Login..." : "Login"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-id">ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="signup-id"
                    type="text"
                    placeholder="Masukkan ID Anda"
                    value={signupData.id}
                    onChange={(e) => {
                      setSignupData({ ...signupData, id: e.target.value });
                      setIdExists(null);
                    }}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCheckId}
                    disabled={!signupData.id || isCheckingId}
                  >
                    {isCheckingId ? (
                      "Checking..."
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {idExists === true && foundUserData && (
                  <div className="text-sm text-green-600 space-y-1">
                    <p>✓ ID ditemukan!</p>
                    <p>Nama: {foundUserData.nama}</p>
                    <p>Departemen: {foundUserData.departemen}</p>
                    <p>Silakan buat password.</p>
                  </div>
                )}
                {idExists === false && (
                  <p className="text-sm text-red-600">✗ ID tidak ditemukan atau belum terdaftar.</p>
                )}
              </div>
              
              {idExists && (
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password Baru</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Buat password baru"
                      value={signupData.password}
                      onChange={(e) =>
                        setSignupData({ ...signupData, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={!idExists || !signupData.password || isRegistering}
                >
                  {isRegistering ? "Menyimpan..." : "Simpan Password"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
};