import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  isLoggedIn as checkIsLoggedIn,
  getCurrentUser,
  submitPresensi,
  uploadPhoto,
} from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Camera as CameraIcon,
  RefreshCw,
  Eye,
  LogIn,
  Home,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "@/components/LoadingScreen";
import { LoginModal } from "@/components/LoginModal";
import { CameraModal } from "@/components/CameraModal";
import { NotificationDialog } from "@/components/NotificationDialog";
import { useCamera } from "@/hooks/useCamera";
import { useLocation } from "@/hooks/useLocation";
import { useDeviceIdentity } from "@/hooks/useDeviceIdentity";
import { useUserData } from "@/hooks/useUserData";
import { useUser } from "@/contexts/UserContext";
import { getTanggalSekarang } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export const PresensiForm = () => {
  const [formData, setFormData] = useState({
    id: "",
    nama: "",
    departemen: "",
    ...getTanggalSekarang(),
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

  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
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

  const {
    cameraModalOpen,
    setCameraModalOpen,
    capturedImage,
    faceDetected,
    videoRef,
    canvasRef,
    capturePhoto,
    retakePhoto,
    mode,
  } = useCamera(formData.lokasi);

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

  const {
    userData,
    setIsDataChecked: setGlobalDataChecked,
    logoutUserGlobal,
    isLoggingOut,
  } = useUser();

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

  useEffect(() => {
    setIsLoggedIn(checkIsLoggedIn());
    setCurrentUser(getCurrentUser());
  }, []);

  // Check login status on component mount and load ID from localStorage
  useEffect(() => {
    setIsLoggedIn(checkIsLoggedIn());
    setCurrentUser(getCurrentUser());

    // Jika user sudah login, isi ID saja dari localStorage
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        id: userData.id,
      }));
    }
  }, [userData]);

  // Auto-set date
  useEffect(() => {
    const { tanggalDisplay, tanggal } = getTanggalSekarang();
    setFormData((prev) => ({
      ...prev,
      tanggalDisplay,
      tanggal,
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

    // console.log(formData.id);

    try {
      // 1. Fetch user data
      setLoadingMessage("Mendapatkan data");
      const userData = await fetchUserData(formData.id.trim());

      // console.log("Fetched user data:", userData);

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

      // console.log("FormData in Handle Check:", formData);

      setIsIdChecked(true);
      setIdNeedsRecheck(false);

      // Simpan juga ke global state
      setGlobalDataChecked(true);

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
    try {
      // 1. Upload foto dulu
      const fileName = `${formData.id}-${formData.tanggalDisplay}-${formData.presensi}.jpg`;

      setLoadingMessage("Upload Foto");
      const uploadRes = await uploadPhoto(
        capturedImage,
        fileName,
        formData.presensi
      );

      if (!uploadRes?.success) {
        setNotification({
          isOpen: true,
          type: "error",
          title: "Upload Gagal",
          message: uploadRes?.message || "Foto gagal diupload",
        });
        return; // stop proses
      }

      const photoData = uploadRes.data;

      setLoadingMessage("Mengirim Data");

      // 2. Submit presensi + sertakan photoFileId
      const response = await submitPresensi({
        id: formData.id,
        nama: formData.nama,
        departemen: formData.departemen,
        presensi: formData.presensi,
        tanggal: formData.tanggal,
        jam: formData.jam,
        lokasi: formData.lokasi,
        urlMaps: formData.urlMaps,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude
          ? parseFloat(formData.longitude)
          : undefined,
        fingerprint: formData.fingerprint,
        photoFileName: photoData.fileName,
        photoFileUrl: photoData.fileUrl,
      });

      // console.log("=== Fake Submit Payload ===");
      // Object.entries(response).forEach(([key, value]) => {
      //   console.log(`${key}:`, value, "| type:", typeof value);
      // });

      // 3. Notifikasi
      if (response.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Presensi Berhasil",
          message: "Data presensi berhasil disimpan!",
        });

        setFormData({
          id: "",
          nama: "",
          departemen: "",
          ...getTanggalSekarang(),
          jam: new Date().toLocaleTimeString("en-GB", { hour12: false }),
          presensi: "",
          longitude: "",
          latitude: "",
          lokasi: "",
          urlMaps: "",
          uuid: "",
          fingerprint: "",
        });
        retakePhoto();
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
      console.error("Gagal submit:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Gagal Submit",
        message: "Terjadi kesalahan saat mengirim data",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // Validation logic
  const isFormValid = () => {
    if (!isIdChecked) return false;
    if (!formData.presensi || formData.presensi.trim() === "") return false;
    if (!formData.lokasi || !formData.uuid || !formData.fingerprint)
      return false;
    return true;
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isCameraEnabled = () => isFormValid();
  const isSubmitEnabled = () => isFormValid() && capturedImage;

  const handleLogoutClick = async () => {
    setLogoutDialogOpen(false);
    await logoutUserGlobal();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background p-4 relative">
      {/* Loading Screen */}
      <LoadingScreen
        isOpen={isChecking || isLoading || isLoggingOut}
        message={isLoggingOut ? "Logout..." : loadingMessage}
      />

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-4">
          <div
            className="relative overflow-hidden rounded-xl p-14 text-center text-white shadow-xl
                  bg-[url('/bg.png')] bg-cover bg-center"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-honda-red/40 to-honda-red-dark/70"></div>

            <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-wide">
                Form Presensi
              </h1>
              <p className="mt-2 text-honda-silver">
                TRIO MOTOR - Honda Authorized Dealer
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm shadow-2xl">
          <div className="p-8 space-y-6">
            {/* ID Field */}
            <div className="space-y-2">
              <div className="flex justify-end">
                {isLoggedIn ? (
                  <div className="flex gap-2">
                    <Button
                      variant="default"
                      onClick={() => navigate("/")}
                      size="sm"
                    >
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setLogoutDialogOpen(true)}
                      disabled={isLoggingOut}
                      size="sm"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setLoginModalOpen(true)}
                    size="sm"
                  >
                    <LogIn className="h-4 w-4" />
                    Login
                  </Button>
                )}
              </div>
            </div>

            <div className="h-px w-full bg-red-700"></div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">ID</label>
              <div className="flex gap-3">
                <Input
                  value={formData.id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="Masukkan ID"
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleCheck}
                  disabled={isChecking || !formData.id.trim() || isLoading}
                  variant={
                    isLoading || isChecking || !formData.id.trim()
                      ? "outline"
                      : isIdChecked
                      ? "default"
                      : "outline"
                  }
                  className={`px-6
                    ${
                      isLoading || isChecking || !formData.id.trim()
                        ? "px-6 text-red-600 border-red-600"
                        : isIdChecked
                        ? "px-6"
                        : "px-6 text-red-600 border-red-600"
                    }`}
                >
                  {isChecking
                    ? "..."
                    : isIdChecked && !idNeedsRecheck
                    ? "Re-cek"
                    : "Cek"}
                </Button>
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nama
              </label>
              <Input
                value={formData.nama || "Belum terisi"}
                readOnly
                className={cn(
                  "bg-muted",
                  !formData.nama && "text-muted-foreground"
                )}
              />
            </div>

            {/* Departemen */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Departemen
              </label>
              <Input
                value={formData.departemen || "Belum terisi"}
                readOnly
                className={cn(
                  "bg-muted",
                  !formData.departemen && "text-muted-foreground"
                )}
              />
            </div>

            {/* Hidden Location for Development - Remove for Production */}

            {/* Hidden inputs for submission */}
            <input type="hidden" value={formData.uuid} />
            <input type="hidden" value={formData.fingerprint} />
            <input type="hidden" value={formData.urlMaps} />
            <input type="hidden" value={formData.latitude} />
            <input type="hidden" value={formData.longitude} />

            {/* Tanggal & Jam */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tanggal
                </label>
                <Input
                  value={formData.tanggalDisplay}
                  readOnly
                  disabled={!isIdChecked || idNeedsRecheck}
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Jam
                </label>
                <Input
                  value={formData.jam}
                  readOnly
                  disabled={!isIdChecked || idNeedsRecheck}
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Waktu Radio */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">
                Keterangan
              </Label>
              <RadioGroup
                value={formData.presensi}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    presensi: value,
                  });
                }}
                className="grid grid-cols-1 md:grid-cols-2 items-center justify-around"
                disabled={isLoading || !isIdChecked || idNeedsRecheck}
              >
                {/* <div className="flex items-center justify-around "> */}
                <div className="grid items-center grid-cols-2 md:flex md:justify-around">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Hadir"
                      id="datang"
                      disabled={!isIdChecked || idNeedsRecheck}
                    />
                    <Label
                      htmlFor="datang"
                      className={cn(
                        !isIdChecked || idNeedsRecheck
                          ? "text-muted-foreground"
                          : ""
                      )}
                    >
                      Datang
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Pulang"
                      id="pulang"
                      disabled={!isIdChecked || idNeedsRecheck}
                    />
                    <Label
                      htmlFor="pulang"
                      className={cn(
                        !isIdChecked || idNeedsRecheck
                          ? "text-muted-foreground"
                          : ""
                      )}
                    >
                      Pulang
                    </Label>
                  </div>
                </div>

                {/* <div className="hidden md:block w-px h-6 bg-border mx-2"></div> */}

                {/* <div className="flex items-center justify-around"> */}
                <div className="grid items-center grid-cols-2 md:flex md:justify-around">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Sakit"
                      id="sakit"
                      disabled={!isIdChecked || idNeedsRecheck}
                    />
                    <Label
                      htmlFor="sakit"
                      className={cn(
                        !isIdChecked || idNeedsRecheck
                          ? "text-muted-foreground"
                          : ""
                      )}
                    >
                      Sakit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="Izin"
                      id="izin"
                      disabled={!isIdChecked || idNeedsRecheck}
                    />
                    <Label
                      htmlFor="izin"
                      className={cn(
                        !isIdChecked || idNeedsRecheck
                          ? "text-muted-foreground"
                          : ""
                      )}
                    >
                      Izin
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Camera Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Foto
              </label>

              <div className="flex gap-2">
                <Button
                  onClick={() => setCameraModalOpen(true)}
                  variant="outline"
                  className="w-full py-6 border-dashed border-2"
                  disabled={!isCameraEnabled() || isLoading}
                >
                  {capturedImage ? (
                    <>
                      <CameraIcon className="mr-2 h-5 w-5" />
                      Lihat Foto
                    </>
                  ) : (
                    <>
                      <Eye className="mr-2 h-5 w-5" />
                      {!isIdChecked ? "Cek ID Terlebih Dahulu" : "Buka Kamera"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="h-px w-full bg-red-700"></div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className="w-full py-6 text-lg font-medium bg-honda-red hover:bg-honda-red-dark shadow-lg disabled:opacity-50"
              disabled={!isSubmitEnabled() || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </Card>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        videoRef={videoRef}
        canvasRef={canvasRef}
        faceDetected={faceDetected}
        onCapture={capturePhoto}
        location={formData.lokasi}
        imageUrl={capturedImage || ""}
        onRetake={retakePhoto}
        mode={mode}
      />

      {/* Notification Modal */}
      <NotificationDialog
        isOpen={notification.isOpen}
        onClose={() => setNotification((prev) => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Confirm Modal */}
      <ConfirmDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Konfirmasi Logout"
        description="Apakah Anda yakin ingin keluar dari sistem?"
        confirmText="Ya, Logout"
        cancelText="Batal"
        onConfirm={handleLogoutClick}
      />

      {/* Login Modal */}
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
