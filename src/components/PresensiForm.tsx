import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Camera as CameraIcon,
  Check,
  X,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingScreen } from "./LoadingScreen";
import { LoginModal } from "./LoginModal";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import { useNavigate } from "react-router-dom";

const API_KEY =
  "AKfycbyLHjveyhMYt7KGjxtSJov1u_nsszZzK0PKyZY-vuxi7C3mMBdMcqGII2vveWZV_jKdZw";

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

  const [isChecking, setIsChecking] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idNeedsRecheck, setIdNeedsRecheck] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Refs for media
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const cameraStartedRef = useRef(false);
  const detectionsRef = useRef<any[]>([]);
  const [model, setModel] = useState(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [showLoginAfterSubmit, setShowLoginAfterSubmit] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  const [locationData, setLocationData] = useState({
    Flatitude: "0",
    Flongitude: "0",
    Flokasi: "",
    FmapUrl: "",
  });

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

  // Initialize camera when modal opens
  useEffect(() => {
    async function startCamera() {
      try {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("camera init error", err);
      }
    }
    if (cameraModalOpen) startCamera();
    return () => {
      // Clean up camera stream when modal closes or component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      // Cancel any running animation frame
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      setCameraActive(false);
      setFaceDetected(false);
    };
  }, [cameraModalOpen]);

  // Load BlazeFace model once
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        await tf.ready();
        const m = await blazeface.load({ maxFaces: 1 });
        if (mounted) setModel(m);
      } catch (err) {
        console.error("model load error", err);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-set date
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tanggal: new Date().toLocaleDateString("en-CA"),
    }));
  }, []);

  // Get UUID from localStorage or create new one
  const getUUID = () => {
    let storedUUID = localStorage.getItem("deviceUUID");
    if (!storedUUID) {
      storedUUID = crypto.randomUUID();
      localStorage.setItem("deviceUUID", storedUUID);
    }
    return storedUUID;
  };

  // Get device fingerprint (simplified version)
  const getFingerprint = async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("Device fingerprint", 2, 2);
      }
      const canvasFingerprint = canvas.toDataURL();

      const fingerprint = btoa(
        navigator.userAgent +
          navigator.language +
          screen.width +
          screen.height +
          new Date().getTimezoneOffset() +
          canvasFingerprint.slice(-50)
      ).slice(0, 20);

      return fingerprint;
    } catch (error) {
      console.error("Error generating fingerprint:", error);
      return "unknown";
    }
  };

  // Generate device identity
  const getDeviceIdentity = async () => {
    const uuid = getUUID();
    const fingerprint = await getFingerprint();
    return { uuid, fingerprint };
  };

  // Fetch user data from Google Apps Script
  const fetchUserData = async (id: string) => {
    try {
      const response = await fetch(
        `https://script.google.com/macros/s/${API_KEY}/exec?getUser=${id}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.exists
        ? { id: data.id, nama: data.nama, departemen: data.departemen }
        : null;
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      throw error;
    }
  };

  // Get address from coordinates using Nominatim
  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.display_name || "Unknown location";
    } catch (error) {
      console.error("Failed to get address:", error);
      return "Error getting location";
    }
  };

  // Get location and decode address
  const getLocationAndDecode = async () => {
    if (!navigator.geolocation) {
      throw new Error("Geolocation is not supported by this browser");
    }

    return new Promise<{
      Flatitude: string;
      Flongitude: string;
      Flokasi: string;
      FmapUrl: string;
    }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            let Flokasi = await getAddressFromCoordinates(latitude, longitude);

            if (accuracy > 300) {
              Flokasi = `⚠ (Lokasi mungkin tidak akurat) ⚠ --- ${Flokasi}`;
            }

            const FmapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

            const locationResult = {
              Flatitude: latitude.toString(),
              Flongitude: longitude.toString(),
              Flokasi,
              FmapUrl,
            };

            setFormData((prev) => ({
              ...prev,
              latitude: locationResult.Flatitude,
              longitude: locationResult.Flongitude,
              lokasi: locationResult.Flokasi,
              urlMaps: locationResult.FmapUrl,
            }));

            resolve(locationResult);
          } catch (error) {
            reject(error);
          }
        },
        (error) => {
          let message = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timeout";
              break;
            default:
              message = "Unknown location error";
          }
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

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
      // setUniqueCode(`${deviceIdentity.uuid}_${deviceIdentity.fingerprint}`);

      // 4. Update form data
      setFormData((prev) => ({
        ...prev,
        id: userData.id,
        nama: userData.nama,
        departemen: userData.departemen,
        uuid: deviceIdentity.uuid,
        fingerprint: deviceIdentity.fingerprint,
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

  // Validation logic
  const isFormValid = () => {
    // if (!isIdChecked) return false;

    // if (!formData.presensi || formData.presensi.trim() === "") return false;

    return true;
  };

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isCameraEnabled = () => isFormValid();
  const isSubmitEnabled = () => isFormValid() && capturedImage;

  useEffect(() => {
    let rafId: number;
    let running = true;

    async function loop() {
      if (
        !cameraModalOpen ||
        !model ||
        !videoRef.current ||
        !canvasRef.current ||
        videoRef.current.readyState < 2
      ) {
        if (running) rafId = requestAnimationFrame(loop);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        if (running) rafId = requestAnimationFrame(loop);
        return;
      }

      // Get the display size of video element
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const predictions = await model.estimateFaces(video, false);
        const detected = predictions && predictions.length > 0;
        setFaceDetected(detected);

        if (detected && predictions.length > 0) {
          // Calculate scale factors
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;
          
          ctx.strokeStyle = "rgba(34,197,94,0.9)";
          ctx.lineWidth = 3;

          predictions.forEach((pred) => {
            const [x1, y1] = pred.topLeft;
            const [x2, y2] = pred.bottomRight;

            // Scale coordinates to canvas size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;

            const width = scaledX2 - scaledX1;
            const height = scaledY2 - scaledY1;

            if (!isMobile) {
              // For mirrored video, flip X coordinates
              const mirroredX = canvas.width - scaledX2;
              ctx.strokeRect(mirroredX, scaledY1, width, height);
            } else {
              ctx.strokeRect(scaledX1, scaledY1, width, height);
            }
          });
        }
      } catch (err) {
        console.error("face detection error:", err);
      }

      if (running) rafId = requestAnimationFrame(loop);
    }

    if (cameraModalOpen && model && !capturedImage) {
      rafId = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [cameraModalOpen, model, capturedImage, isMobile]);

  const startCamera = useCallback(async () => {
    if (cameraStartedRef.current) return;

    try {
      console.log("Starting camera...");

      // Open modal first
      setCameraModalOpen(true);
      setLoadingMessage("Memulai kamera...");

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access not supported");
      }

      const constraints: MediaStreamConstraints = {
        video: { facingMode: isMobile ? "user" : "environment" },
      };

      console.log("Getting user media with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log("Got media stream:", stream);

      const track = stream.getVideoTracks()[0];
      console.log("Track settings:", track.getSettings());
      console.log("Track readyState:", track.readyState);

      // Wait a bit for modal to render
      await new Promise((resolve) => setTimeout(resolve, 200));

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        console.log("Video element configured, waiting for metadata...");

        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            console.error("Video loading timeout");
            reject(new Error("Video loading timeout"));
          }, 10000);

          const onLoaded = async () => {
            console.log(
              "Metadata loaded:",
              video.videoWidth,
              video.videoHeight
            );
            clearTimeout(timeoutId);
            video.removeEventListener("loadedmetadata", onLoaded);

            console.log("Video metadata:", video.videoWidth, video.videoHeight);
            console.log(
              "Video client size:",
              video.clientWidth,
              video.clientHeight
            );
            try {
              await video.play();
              console.log("Video is playing now");
              resolve();
            } catch (err) {
              console.error("Video play failed:", err);
              reject(err);
            }
          };

          video.addEventListener("loadedmetadata", onLoaded);
        });
      }

      cameraStartedRef.current = true;
      setCameraActive(true);
      setFaceDetected(false);
      setLoadingMessage("");

      console.log("Camera started successfully");
    } catch (error) {
      console.error("Error starting camera:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Kamera Tidak Dapat Diakses",
        message:
          "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan dan kamera tidak sedang digunakan aplikasi lain.",
      });
      setCameraModalOpen(false);
      setLoadingMessage("");
    }
  }, [isMobile]);

  // Stop camera
  const stopCamera = useCallback(() => {
    // cancel animation
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    // reset flags
    cameraStartedRef.current = false;
    setCameraActive(false);
    setCameraModalOpen(false);
    setFaceDetected(false);
    detectionsRef.current = [];
  }, []);

  // Auto-stop camera when modal closes
  useEffect(() => {
    if (!cameraModalOpen) {
      stopCamera();
    }
  }, [cameraModalOpen, stopCamera]);

  // Open preview modal
  const openPreview = () => {
    setPreviewModalOpen(true);
  };

  // Fungsi untuk membungkus teks agar setelah ambil foto
  function wrapText(
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    words.forEach((word) => {
      const testLine = line + word + " ";
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    });
    lines.push(line.trim());
    return lines;
  }

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror untuk desktop
        if (!isMobile) {
          context.save();
          context.scale(-1, 1);
          context.drawImage(
            video,
            -canvas.width,
            0,
            canvas.width,
            canvas.height
          );
          context.restore();
        } else {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // ===== Overlay text =====
        const currentTime = new Date().toLocaleString("id-ID");
        const locationText =
          formData.lokasi || locationData.Flokasi || "Lokasi tidak tersedia";

        const fontSize = Math.max(14, canvas.width / 54);
        context.font = `${fontSize}px Arial`;
        context.textAlign = "left";
        context.textBaseline = "bottom";
        context.fillStyle = "white";

        context.shadowColor = "rgba(0, 0, 0, 0.8)"; // warna bayangan
        context.shadowBlur = 6; // seberapa lembut bayangan
        context.shadowOffsetX = 2; // geser horizontal
        context.shadowOffsetY = 2; // geser vertikal

        const padding = 25;
        const lineHeight = fontSize * 1.4;

        const wrappedLocation = wrapText(
          context,
          locationText,
          canvas.width - padding * 2
        );

        const lines = [...wrappedLocation, currentTime];
        const startY = canvas.height - padding;

        lines.forEach((line, index) => {
          const y = startY - (lines.length - 1 - index) * lineHeight;
          context.fillText(line, padding, y);
        });

        // ===== Save image =====
        const imageData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedImage(imageData);
        stopCamera();
        openPreview();
      }
    }
  }, [stopCamera, locationData.Flokasi, formData.lokasi, isMobile]);

  const retakePhoto = () => {
    setPreviewModalOpen(false);
    setCapturedImage(null);
    startCamera();
  };

  const deletePhoto = () => {
    setCapturedImage(null);
    setPreviewModalOpen(false);
  };

  const resetForm = () => {
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
    setIsIdChecked(false);
    setIdNeedsRecheck(false);
    setCapturedImage(null);
    setLocationData({
      Flatitude: "0",
      Flongitude: "0",
      Flokasi: "",
      FmapUrl: "",
    });
    // setUniqueCode("");
  };

  const handleSubmit = async () => {
    if (!isSubmitEnabled()) return;

    setIsLoading(true);
    setLoadingMessage("Mengirim data");

    try {
      if (!capturedImage) {
        throw new Error(
          "Foto belum diambil. Harap ambil foto terlebih dahulu."
        );
      }

      const submitFormData = new FormData();

      submitFormData.append("id", formData.id.trim());
      submitFormData.append("nama", formData.nama.trim());
      submitFormData.append("departemen", formData.departemen.trim());
      submitFormData.append("tanggal", formData.tanggal);
      submitFormData.append("presensi", formData.presensi.trim());
      submitFormData.append("lokasi", formData.lokasi);
      submitFormData.append("urlMaps", formData.urlMaps);
      submitFormData.append("latitude", formData.latitude.trim());
      submitFormData.append("longitude", formData.longitude.trim());
      submitFormData.append("jam", formData.jam);
      const deviceIdentity = await getDeviceIdentity();
      submitFormData.append("uuid", deviceIdentity.uuid);
      submitFormData.append("fingerprint", deviceIdentity.fingerprint);

      submitFormData.append("photoData", capturedImage);

      console.log(
        "Data form yang akan dikirim:",
        Object.fromEntries(submitFormData.entries())
      );

      const response = await fetch(
        `https://script.google.com/macros/s/${API_KEY}/exec`,
        {
          method: "POST",
          body: submitFormData,
          redirect: "follow",
        }
      );

      console.log("Response status:", response.status);

      let result = { success: false, message: "" };
      let rawText = "";

      try {
        rawText = await response.text();
        console.log("Raw text dari response:", rawText);
        result = JSON.parse(rawText);
      } catch (jsonError) {
        console.warn(
          "Gagal parsing JSON. Tapi response 200, kita anggap berhasil."
        );
        result.success = true;
        result.message = "Presensi berhasil (parsed error)";
      }

      if (result.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Presensi Berhasil",
          message: "Presensi berhasil!",
        });
        setShowLoginAfterSubmit(true);
        resetForm();
      } else {
        throw new Error(result.message || "Gagal presensi. Coba lagi.");
      }
    } catch (error) {
      console.error("Gagal mengirim data:", error);
      let errorMessage = "Gagal mengirim data. Coba lagi nanti.";

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setNotification({
        isOpen: true,
        type: "error",
        title: "Gagal Submit",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/50 to-background p-4 relative">
      {/* Loading Screen */}
      <LoadingScreen
        isOpen={isChecking || isLoading}
        message={loadingMessage}
      />

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
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
                  value={formData.tanggal}
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
                className="flex flex-wrap items-center justify-around"
                disabled={isLoading || !isIdChecked || idNeedsRecheck}
              >
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

                <div className="w-px h-6 bg-border mx-2"></div>

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
              </RadioGroup>
            </div>

            {/* Camera Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Foto
              </label>

              {!capturedImage && (
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full py-6 border-dashed border-2"
                  disabled={!isCameraEnabled() || isLoading}
                >
                  <CameraIcon className="mr-2 h-5 w-5" />
                  {!isIdChecked ? "Cek ID Terlebih Dahulu" : "Buka Kamera"}
                </Button>
              )}

              {capturedImage && (
                <Button
                  onClick={openPreview}
                  variant="outline"
                  className="w-full py-6 border-dashed border-2"
                  disabled={!isCameraEnabled() || isLoading}
                >
                  <Eye className="mr-2 h-5 w-5" />
                  Lihat Foto
                </Button>
              )}
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

            {/* Login/Dashboard Link */}
            <div className="text-center mt-4">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Dashboard
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setLoginModalOpen(true)}
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </Card>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera Modal */}
      <Dialog
        open={cameraModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCameraModalOpen(false);
            // Force cleanup when modal closes
            if (streamRef.current) {
              streamRef.current.getTracks().forEach((track) => track.stop());
              streamRef.current = null;
            }
            if (videoRef.current) {
              videoRef.current.srcObject = null;
            }
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            setCameraActive(false);
            setFaceDetected(false);
          }
        }}
      >
        <DialogContent className="w-full h-full max-w-none p-0 sm:max-w-2xl sm:h-auto sm:p-6">
          {/* Mobile fullscreen header */}
          <div className="block sm:hidden">
            <div className="absolute top-0 left-0 right-0 z-50 bg-black/80 p-4">
              <div className="flex items-center justify-between text-white">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CameraIcon className="h-5 w-5" />
                    Ambil Foto Presensi
                  </h2>
                  <p className="text-sm text-white/80 mt-1">
                    Pastikan wajah Anda terlihat jelas dalam frame
                  </p>
                </div>
                <Button
                  onClick={stopCamera}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Desktop header */}
          <div className="hidden sm:block">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CameraIcon className="h-5 w-5" />
                Ambil Foto Presensi
              </DialogTitle>
              <DialogDescription>
                Pastikan wajah Anda terlihat jelas dalam frame kamera
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="h-full sm:h-auto space-y-4 sm:space-y-4">
            {/* Camera container */}
            <div className="relative bg-black mx-auto h-full sm:h-auto sm:max-w-sm sm:rounded-lg overflow-hidden">
              {/* 4:5 aspect ratio container - fullscreen on mobile, constrained on desktop */}
              <div className="relative w-full h-full sm:h-auto" style={{ aspectRatio: isMobile ? 'unset' : '4/5' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover sm:rounded-lg ${
                    !isMobile ? "transform scale-x-[-1]" : ""
                  }`}
                />
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full pointer-events-none ${
                    !isMobile ? "transform scale-x-[-1]" : ""
                  }`}
                />

                {/* Face detection status */}
                <div className="absolute top-20 sm:top-2 left-1/2 -translate-x-1/2 z-40">
                  {faceDetected ? (
                    <span className="bg-green-600 text-white text-sm sm:text-xs px-4 py-2 sm:px-3 sm:py-1 rounded-full shadow-md">
                      Wajah ditemukan
                    </span>
                  ) : (
                    <span className="bg-red-600 text-white text-sm sm:text-xs px-4 py-2 sm:px-3 sm:py-1 rounded-full shadow-md">
                      Arahkan wajah ke kamera
                    </span>
                  )}
                </div>

                {/* Location and time overlay */}
                <div className="absolute bottom-20 sm:bottom-3 left-3 text-white text-sm sm:text-xs pointer-events-none z-40">
                  <div className="space-y-1">
                    <div className="bg-black/50 px-3 py-2 sm:px-2 sm:py-1 rounded text-shadow">
                      {formData.lokasi ||
                        locationData.Flokasi ||
                        "Mendapatkan lokasi..."}
                    </div>
                    <div className="bg-black/50 px-3 py-2 sm:px-2 sm:py-1 rounded text-shadow">
                      {new Date().toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>

                {/* Mobile capture button overlay */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 sm:hidden">
                  <Button
                    onClick={capturePhoto}
                    disabled={!faceDetected || isLoading}
                    className={`w-20 h-20 rounded-full ${
                      faceDetected
                        ? "bg-white text-black hover:bg-gray-100 border-4 border-white"
                        : "bg-gray-400 text-gray-600 cursor-not-allowed border-4 border-gray-400"
                    }`}
                  >
                    <CameraIcon className="w-10 h-10" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Desktop controls */}
            <div className="hidden sm:flex gap-3 justify-center">
              <Button
                onClick={capturePhoto}
                disabled={!faceDetected || isLoading}
                className={`flex-1 max-w ${
                  faceDetected
                    ? "bg-honda-red hover:bg-honda-red-dark"
                    : "bg-gray-400 cursor-not-allowed"
                }`}
              >
                <CameraIcon className="mr-2 h-4 w-4" />
                Ambil Foto
              </Button>
              <Button onClick={stopCamera} variant="outline">
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={previewModalOpen}
        onOpenChange={(open) => {
          if (open) {
            stopCamera();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CameraIcon className="h-5 w-5" />
              Lihat Foto Presensi
            </DialogTitle>
            <DialogDescription>
              Pastikan wajah Anda terlihat jelas dalam frame kamera
            </DialogDescription>
          </DialogHeader>

          {/* {cameraActive && ( */}
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <div className="relative rounded-lg overflow-hidden">
                <img
                  src={capturedImage}
                  alt="Captured"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={retakePhoto}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                <CameraIcon className="mr-2 h-4 w-4" />
                Ambil Ulang
              </Button>
              <Button
                onClick={deletePhoto}
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
                Hapus
              </Button>
              <Button
                onClick={() => setPreviewModalOpen(false)}
                variant="outline"
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                disabled={isLoading}
              >
                <Check className="mr-2 h-4 w-4" />
                Simpan
              </Button>
            </div>
          </div>
          {/* )} */}
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog
        open={notification.isOpen}
        onOpenChange={(open) =>
          setNotification((prev) => ({ ...prev, isOpen: open }))
        }
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              {notification.title}
            </DialogTitle>
            <DialogDescription className="text-left">
              {notification.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            {showLoginAfterSubmit && notification.type === "success" ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setNotification((prev) => ({ ...prev, isOpen: false }));
                    setShowLoginAfterSubmit(false);
                  }}
                >
                  Tutup
                </Button>
                <Button
                  onClick={() => {
                    setNotification((prev) => ({ ...prev, isOpen: false }));
                    setShowLoginAfterSubmit(false);
                    setLoginModalOpen(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Login
                </Button>
              </div>
            ) : (
              <Button
                onClick={() =>
                  setNotification((prev) => ({ ...prev, isOpen: false }))
                }
                className={
                  notification.type === "success"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                OK
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLogin={(credentials) => {
          console.log("Login attempt:", credentials);
          setIsLoggedIn(true);
          setLoginModalOpen(false);
          navigate("/dashboard");
        }}
      />
    </div>
  );
};
