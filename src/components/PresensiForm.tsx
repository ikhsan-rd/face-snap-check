import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  isLoggedIn as checkIsLoggedIn,
  getCurrentUser,
  submitPresensi,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Camera as CameraIcon,
  Check,
  X,
  Trash2,
  RefreshCw,
  Eye,
  LogIn,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "./LoadingScreen";
import { LoginModal } from "./LoginModal";
import { CameraModal } from "./CameraModal";
import { PhotoPreview } from "./PhotoPreview";
import { NotificationDialog } from "./NotificationDialog";
import { useCamera } from "@/hooks/useCamera";
import { useLocation } from "@/hooks/useLocation";
import { useDeviceIdentity } from "@/hooks/useDeviceIdentity";
import { useUserData } from "@/hooks/useUserData";

export const PresensiForm = () => {
  const [formData, setFormData] = useState({
    id: "",
    nama: "",
    departemen: "",
    tanggal: new Date().toLocaleDateString("en-CA"),
    jam: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    presensi: "",
    longitude: "",
    latitude: "",
    lokasi: "",
    urlMaps: "",
    uuid: "",
    fingerprint: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showLoginAfterSubmit, setShowLoginAfterSubmit] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const navigate = useNavigate();
  const { toast } = useToast();

  // Custom hooks
  const {
    cameraModalOpen,
    setCameraModalOpen,
    capturedImage,
    faceDetected,
    videoRef,
    canvasRef,
    capturePhoto,
    deletePhoto,
    retakePhoto,
  } = useCamera();

  const { getLocationAndDecode } = useLocation();
  const { getDeviceIdentity } = useDeviceIdentity();
  const {
    isChecking,
    setIsChecking,
    isIdChecked,
    setIsIdChecked,
    idNeedsRecheck,
    setIdNeedsRecheck,
    fetchUserData,
  } = useUserData();

  // Real-time clock update
  useEffect(() => {
    const interval = setInterval(() => {
      setFormData((prev) => ({
        ...prev,
        jam: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Check login status on component mount
  useEffect(() => {
    setIsLoggedIn(checkIsLoggedIn());
    setCurrentUser(getCurrentUser());
  }, []);

  // Auto-set date
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tanggal: new Date().toLocaleDateString("en-CA"),
    }));
  }, []);

  // Handle ID changes - mark as needing recheck
  const handleIdChange = (value: string) => {
    setFormData({ ...formData, id: value, nama: "", departemen: "" });
    setIsIdChecked(false);
    setIdNeedsRecheck(true);
  };

  const handleCheck = async () => {
    if (!formData.id.trim()) return;

    setIsChecking(true);

    try {
      // 1. Fetch user data
      setLoadingMessage("Mendapatkan data");
      const userData = await fetchUserData(formData.id.trim());

      if (!userData) {
        setNotification({
          isOpen: true,
          type: "error",
          title: "ID Tidak Ditemukan",
          message:
            "ID tidak ditemukan dalam database. Pastikan ID yang dimasukkan benar.",
        });
        setIsChecking(false);
        return;
      }

      // 2. Get location
      setLoadingMessage("Mendapatkan lokasi");
      const locationResult = await getLocationAndDecode();

      // 3. Generate unique code
      const deviceIdentity = await getDeviceIdentity();

      // 4. Update form data
      setFormData((prev) => ({
        ...prev,
        id: userData.id,
        nama: userData.nama,
        departemen: userData.departemen,
        uuid: deviceIdentity.uuid,
        fingerprint: deviceIdentity.fingerprint,
        latitude: locationResult.Flatitude,
        longitude: locationResult.Flongitude,
        lokasi: locationResult.Flokasi,
        urlMaps: locationResult.FmapUrl,
      }));

      // Log development data to console
      console.log("=== DEVELOPMENT DATA ===");
      console.log("User Location:", locationResult.Flokasi);
      console.log("Unique Code:", deviceIdentity);
      console.log("Latitude:", locationResult.Flatitude);
      console.log("Longitude:", locationResult.Flongitude);
      console.log("Google Maps Link:", locationResult.FmapUrl);
      console.log("=========================");

      setIsIdChecked(true);
      setIdNeedsRecheck(false);
      setNotification({
        isOpen: true,
        type: "success",
        title: "Data Berhasil Diambil",
        message: "Data pengguna dan lokasi berhasil diperoleh.",
      });
    } catch (error) {
      console.error("Check failed:", error);
      let errorMessage = "Gagal mengambil data";
      if (error instanceof Error) {
        if (error.message.includes("Location")) {
          errorMessage = `Gagal mendapatkan lokasi: ${error.message}`;
        } else if (error.message.includes("fetch")) {
          errorMessage = "Gagal mengakses server. Periksa koneksi internet.";
        } else {
          errorMessage = error.message;
        }
      }
      setNotification({
        isOpen: true,
        type: "error",
        title: "Gagal Mengambil Data",
        message: errorMessage,
      });
    } finally {
      setIsChecking(false);
      setLoadingMessage("");
    }
  };

  const handleSubmit = async () => {
    if (!capturedImage) return;

    setIsLoading(true);
    setLoadingMessage("Mengirim data presensi...");

    try {
      const response = await submitPresensi({
        id: formData.id,
        nama: formData.nama,
        departemen: formData.departemen,
        presensi: formData.presensi,
        tanggal: formData.tanggal,
        jam: formData.jam,
        lokasi: formData.lokasi,
        urlMaps: formData.urlMaps,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        photoData: capturedImage,
        photoFileName: `${formData.id}-${formData.tanggal}-${formData.presensi}.png`,
        fingerprint: formData.fingerprint,
      });

      if (response.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Presensi Berhasil",
          message: "Data presensi berhasil disimpan!",
        });

        // Reset form
        setFormData({
          id: "",
          nama: "",
          departemen: "",
          tanggal: new Date().toLocaleDateString("en-CA"),
          jam: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          presensi: "",
          longitude: "",
          latitude: "",
          lokasi: "",
          urlMaps: "",
          uuid: "",
          fingerprint: "",
        });
        deletePhoto();
        setIsIdChecked(false);
        setIdNeedsRecheck(false);
      } else {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Presensi Gagal",
          message: response.message || "Gagal menyimpan data presensi",
        });
      }
    } catch (error) {
      console.error("Submit failed:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Error",
        message: "Terjadi kesalahan saat mengirim data",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Validation logic
  const isFormValid = () => {
    return isIdChecked && formData.presensi && formData.presensi.trim() !== "";
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isCameraEnabled = () => isFormValid();
  const isSubmitEnabled = () => isFormValid() && capturedImage;

  if (isLoading) {
    return <LoadingScreen isOpen={true} message={loadingMessage} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/20 to-background p-4">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header with Login/Dashboard Button */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-primary">Presensi Online</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isLoggedIn) {
                navigate("/dashboard");
              } else {
                setLoginModalOpen(true);
              }
            }}
            className="flex items-center gap-2"
          >
            {isLoggedIn ? (
              <>
                <Home className="w-4 h-4" />
                Dashboard
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login
              </>
            )}
          </Button>
        </div>

        <Card className="p-6 space-y-4">
          {/* ID Input */}
          <div className="space-y-2">
            <Label htmlFor="id">ID Pengguna *</Label>
            <div className="flex gap-2">
              <Input
                id="id"
                value={formData.id}
                onChange={(e) => handleIdChange(e.target.value)}
                placeholder="Masukkan ID Anda"
                className={cn(
                  isIdChecked && "border-green-500",
                  idNeedsRecheck && "border-yellow-500"
                )}
              />
              <Button
                onClick={handleCheck}
                disabled={!formData.id || isChecking}
                variant={isIdChecked ? "default" : "outline"}
              >
                {isChecking ? "..." : isIdChecked ? "✓" : "Cek"}
              </Button>
            </div>
          </div>

          {/* User Information */}
          {formData.nama && (
            <div className="space-y-2">
              <div>
                <Label>Nama</Label>
                <Input value={formData.nama} disabled />
              </div>
              <div>
                <Label>Departemen</Label>
                <Input value={formData.departemen} disabled />
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tanggal</Label>
              <Input value={formData.tanggal} disabled />
            </div>
            <div>
              <Label>Jam</Label>
              <Input value={formData.jam} disabled />
            </div>
          </div>

          {/* Presensi Type */}
          <div className="space-y-2">
            <Label>Keterangan Presensi *</Label>
            <RadioGroup
              value={formData.presensi}
              onValueChange={(value) =>
                setFormData({ ...formData, presensi: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hadir" id="hadir" />
                <Label htmlFor="hadir">Hadir</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pulang" id="pulang" />
                <Label htmlFor="pulang">Pulang</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="izin" id="izin" />
                <Label htmlFor="izin">Izin</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sakit" id="sakit" />
                <Label htmlFor="sakit">Sakit</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Camera Section */}
          <div className="space-y-2">
            <Label>Foto Wajah *</Label>
            {capturedImage ? (
              <div className="space-y-2">
                <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewModalOpen(true)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" onClick={deletePhoto}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus
                  </Button>
                  <Button onClick={retakePhoto}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Ulang
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setCameraModalOpen(true)}
                disabled={!isCameraEnabled()}
                variant="outline"
                className="w-full h-12"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                {isMobile ? "Buka Kamera" : "Akses Kamera"}
              </Button>
            )}
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isSubmitEnabled()}
            className="w-full"
            size="lg"
          >
            <Check className="w-4 h-4 mr-2" />
            Kirim Presensi
          </Button>
        </Card>
      </div>

      {/* Modals */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        videoRef={videoRef}
        canvasRef={canvasRef}
        faceDetected={faceDetected}
        onCapture={capturePhoto}
      />

      <PhotoPreview
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        imageUrl={capturedImage || ""}
        onDelete={deletePhoto}
        onRetake={retakePhoto}
      />

      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={() => {
          setIsLoggedIn(true);
          setCurrentUser(getCurrentUser());
        }}
      />
    </div>
  );
};