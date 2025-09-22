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
    email: "",
    password: "",
  });
  const [signupData, setSignupData] = useState({
    id: "",
    password: "",
  });
  const [idExists, setIdExists] = useState<boolean | null>(null);
  const [isCheckingId, setIsCheckingId] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(credentials);
    setCredentials({ email: "", password: "" });
    navigate("/overview");
  };

  const handleCheckId = async () => {
    if (!signupData.id) return;
    
    setIsCheckingId(true);
    // Simulate ID check - replace with actual backend call later
    setTimeout(() => {
      // Mock: ID exists if it contains "admin" or "user"
      const exists = signupData.id.toLowerCase().includes("admin") || signupData.id.toLowerCase().includes("user");
      setIdExists(exists);
      setIsCheckingId(false);
    }, 1000);
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (idExists && signupData.password) {
      // Save password to existing ID (mock)
      console.log("Saving password for ID:", signupData.id);
      setSignupData({ id: "", password: "" });
      setIdExists(null);
      navigate("/overview");
      onClose();
    }
  };

  return (
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={credentials.email}
                  onChange={(e) =>
                    setCredentials({ ...credentials, email: e.target.value })
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
                <Button type="submit" className="flex-1">
                  Login
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
                {idExists === true && (
                  <p className="text-sm text-green-600">✓ ID ditemukan! Silakan buat password.</p>
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
                  disabled={!idExists || !signupData.password}
                >
                  Simpan Password
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};