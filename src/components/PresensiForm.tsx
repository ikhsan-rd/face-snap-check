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
import { FaceDetection } from "@mediapipe/face_detection";

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

  // Camera and face detection refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const faceDetectorRef = useRef<FaceDetection | null>(null);
  const detectionsRef = useRef<any[]>([]);
  const cameraStartedRef = useRef(false);
  const [faceDetected, setFaceDetected] = useState(false);

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

  // Check if mobile device
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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

  // Auto-set date
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tanggal: new Date().toLocaleDateString("en-CA"),
    }));
  }, []);

  // Initialize MediaPipe Face Detection
  useEffect(() => {
    let mounted = true;
    
    const initFaceDetection = async () => {
      try {
        console.log("Initializing MediaPipe Face Detection...");
        const faceDetection = new FaceDetection({
          locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`,
        });
        
        faceDetection.setOptions({
          model: "short",
          minDetectionConfidence: 0.6,
        });
        
        faceDetection.onResults((results) => {
          if (mounted) {
            detectionsRef.current = results.detections || [];
            setFaceDetected((results.detections || []).length > 0);
          }
        });
        
        if (mounted) {
          faceDetectorRef.current = faceDetection;
          console.log("Face detection initialized successfully");
        }
      } catch (error) {
        console.error("Failed to initialize face detection:", error);
      }
    };

    // Add a small delay to ensure DOM is ready
    setTimeout(initFaceDetection, 1000);

    return () => {
      mounted = false;
      try {
        if (faceDetectorRef.current) {
          // @ts-ignore
          faceDetectorRef.current.close?.();
        }
      } catch (error) {
        console.warn("Error closing face detector:", error);
      }
      faceDetectorRef.current = null;
    };
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

  // Get device fingerprint
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

  // Handle ID changes
  const handleIdChange = (value: string) => {
    setFormData({ ...formData, id: value, nama: "", departemen: "" });
    setIsIdChecked(false);
    setIdNeedsRecheck(true);
  };

  const handleCheck = async () => {
    if (!formData.id.trim()) return;

    setIsChecking(true);

    try {
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

      setLoadingMessage("Mendapatkan lokasi");
      const locationResult = await getLocationAndDecode();

      const deviceIdentity = await getDeviceIdentity();

      setFormData((prev) => ({
        ...prev,
        id: userData.id,
        nama: userData.nama,
        departemen: userData.departemen,
        uuid: deviceIdentity.uuid,
        fingerprint: deviceIdentity.fingerprint,
      }));

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

  // Drawing loop for face detection overlay
  const drawLoop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const faceDetector = faceDetectorRef.current;

    if (!video || !canvas || !cameraActive) {
      if (cameraActive) {
        rafRef.current = requestAnimationFrame(drawLoop);
      }
      return;
    }

    // Wait for video to have dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      rafRef.current = requestAnimationFrame(drawLoop);
      return;
    }

    const w = video.videoWidth;
    const h = video.videoHeight;

    // Sync canvas size with video
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(drawLoop);
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, w, h);

    // Process face detection
    try {
      if (faceDetector && video.readyState >= 2) {
        await faceDetector.send({ image: video });
      }
    } catch (error) {
      // Ignore face detection errors to avoid stopping the loop
    }

    // Draw face detection overlays
    const detections = detectionsRef.current || [];
    if (detections.length > 0) {
      detections.forEach((detection) => {
        try {
          const bbox = detection.boundingBox;
          if (!bbox) return;

          let x, y, width, height;

          if (bbox.xCenter !== undefined) {
            // Normalized center-based coordinates
            const centerX = bbox.xCenter * w;
            const centerY = bbox.yCenter * h;
            const boxWidth = bbox.width * w;
            const boxHeight = bbox.height * h;
            
            x = centerX - boxWidth / 2;
            y = centerY - boxHeight / 2;
            width = boxWidth;
            height = boxHeight;
          } else {
            // Fallback for other coordinate systems
            x = (bbox.xMin || bbox.originX || 0) * w;
            y = (bbox.yMin || bbox.originY || 0) * h;
            width = bbox.width * w;
            height = bbox.height * h;
          }

          // Mirror X coordinate for desktop (since video is mirrored)
          if (!isMobile) {
            x = w - x - width;
          }

          // Draw bounding box
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);

          // Draw face detected badge
          const badgeWidth = Math.min(160, width);
          const badgeHeight = 24;
          const badgeX = x;
          const badgeY = Math.max(0, y - badgeHeight - 5);

          ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
          ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
          
          ctx.fillStyle = "white";
          ctx.font = "14px Arial";
          ctx.textAlign = "left";
          ctx.fillText("Wajah terdeteksi", badgeX + 5, badgeY + 16);
        } catch (error) {
          // Ignore drawing errors for individual detections
        }
      });
    }

    // Draw timestamp and location overlay
    try {
      const currentTime = new Date().toLocaleString("id-ID");
      const locationText =
        formData.lokasi || locationData.Flokasi || "Lokasi tidak tersedia";

      ctx.font = "16px Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillStyle = "white";
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;

      const padding = 10;
      const lines = [locationText, currentTime];
      const lineHeight = 20;

      lines.forEach((line, index) => {
        const y = h - padding - (lines.length - 1 - index) * lineHeight;
        ctx.strokeText(line, padding, y);
        ctx.fillText(line, padding, y);
      });
    } catch (error) {
      // Ignore overlay drawing errors
    }

    rafRef.current = requestAnimationFrame(drawLoop);
  }, [cameraActive, formData.lokasi, locationData.Flokasi, isMobile]);

  // Start camera with proper initialization
  const startCamera = useCallback(async () => {
    if (cameraStartedRef.current) return;

    try {
      setLoadingMessage("Memulai kamera...");
      console.log("Starting camera...");
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported by this browser");
      }

      const constraints: MediaStreamConstraints = {
        video: isMobile 
          ? { 
              facingMode: "user",
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 }
            }
          : { 
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 }
            }
      };

      console.log("Getting user media with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      console.log("Got media stream:", stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;

        console.log("Video element configured, waiting for metadata...");

        // Wait for video to be ready with better error handling
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!;
          
          const timeoutId = setTimeout(() => {
            console.error("Video loading timeout");
            reject(new Error("Video loading timeout"));
          }, 15000);

          const onLoadedMetadata = () => {
            console.log("Video metadata loaded");
            clearTimeout(timeoutId);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            resolve();
          };

          const onError = (error: Event) => {
            console.error("Video error:", error);
            clearTimeout(timeoutId);
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            video.removeEventListener("error", onError);
            reject(new Error("Video failed to load"));
          };

          video.addEventListener("loadedmetadata", onLoadedMetadata);
          video.addEventListener("error", onError);
          
          // Force play
          video.play().catch((playError) => {
            console.warn("Autoplay failed:", playError);
            // Don't reject here, video might still work
          });
        });
      }

      cameraStartedRef.current = true;
      setCameraActive(true);
      setCameraModalOpen(true);
      setFaceDetected(false);

      console.log("Camera started successfully");

      // Start the drawing loop with a slight delay
      setTimeout(() => {
        if (!rafRef.current && cameraActive) {
          rafRef.current = requestAnimationFrame(drawLoop);
        }
      }, 100);

    } catch (error) {
      console.error("Error starting camera:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Kamera Tidak Dapat Diakses",
        message:
          "Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan dan kamera tidak sedang digunakan aplikasi lain.",
      });
    } finally {
      setLoadingMessage("");
    }
  }, [drawLoop, isMobile, cameraActive]);

  // Stop camera
  const stopCamera = useCallback(() => {
    // Cancel animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // Stop media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset states
    cameraStartedRef.current = false;
    setCameraActive(false);
    setCameraModalOpen(false);
    setFaceDetected(false);
    detectionsRef.current = [];
  }, []);

  // Auto-stop camera when modal closes
  useEffect(() => {
    if (!cameraModalOpen && cameraActive) {
      stopCamera();
    }
  }, [cameraModalOpen, cameraActive, stopCamera]);

  // Validation logic
  const isFormValid = () => {
    return isIdChecked && !idNeedsRecheck && formData.presensi.trim() !== "";
  };

  const isCameraEnabled = () => isFormValid();
  const isSubmitEnabled = () => isFormValid() && capturedImage;

  // Text wrapping utility for overlay
  const wrapText = (
    context: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    words.forEach((word) => {
      const testLine = line + word + " ";
      const metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    });
    lines.push(line.trim());
    return lines;
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Set canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame (mirror for desktop)
    if (!isMobile) {
      context.save();
      context.scale(-1, 1);
      context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
      context.restore();
    } else {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    // Add overlay text
    const currentTime = new Date().toLocaleString("id-ID");
    const locationText = formData.lokasi || locationData.Flokasi || "Lokasi tidak tersedia";

    const fontSize = Math.max(16, canvas.width / 50);
    context.font = `${fontSize}px Arial`;
    context.textAlign = "left";
    context.textBaseline = "bottom";
    context.fillStyle = "white";
    context.strokeStyle = "black";
    context.lineWidth = 2;

    const padding = 20;
    const lineHeight = fontSize * 1.4;
    const maxWidth = canvas.width - padding * 2;

    const wrappedLocation = wrapText(context, locationText, maxWidth);
    const lines = [...wrappedLocation, currentTime];
    const startY = canvas.height - padding;

    lines.forEach((line, index) => {
      const y = startY - (lines.length - 1 - index) * lineHeight;
      context.strokeText(line, padding, y);
      context.fillText(line, padding, y);
    });

    // Save image
    const imageData = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(imageData);
    stopCamera();
    setPreviewModalOpen(true);
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
  };

  const handleSubmit = async () => {
    if (!isSubmitEnabled()) return;

    setIsLoading(true);
    setLoadingMessage("Mengirim data");

    try {
      if (!capturedImage) {
        throw new Error("Foto belum diambil. Harap ambil foto terlebih dahulu.");
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

      console.log("Data form yang akan dikirim:", Object.fromEntries(submitFormData.entries()));

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
      try {
        const rawText = await response.text();
        console.log("Raw response:", rawText);
        result = JSON.parse(rawText);
      } catch (jsonError) {
        console.warn("JSON parse failed, assuming success for 200 response");
        result.success = true;
        result.message = "Presensi berhasil";
      }

      if (result.success) {
        setNotification({
          isOpen: true,
          type: "success",
          title: "Presensi Berhasil",
          message: "Presensi berhasil dikirim!",
        });
        resetForm();
      } else {
        throw new Error(result.message || "Gagal mengirim presensi");
      }
    } catch (error) {
      console.error("Submit failed:", error);
      setNotification({
        isOpen: true,
        type: "error",
        title: "Gagal Submit",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim data",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-4">
      {/* Loading Screen */}
      <LoadingScreen
        isOpen={isChecking || isLoading}
        message={loadingMessage}
      />

      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl p-16 text-center text-white shadow-[var(--shadow-elegant)]">
            <div className="absolute inset-0 bg-gradient-to-br from-honda-red via-honda-red-dark to-honda-red opacity-90"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold tracking-wide mb-2">
                Form Presensi
              </h1>
              <p className="text-honda-silver text-lg">
                TRIO MOTOR - Honda Authorized Dealer
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-0 bg-card/90 backdrop-blur-sm shadow-[var(--shadow-elegant)] rounded-2xl">
          <div className="p-8 space-y-6">
            {/* ID Field */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">ID Karyawan</Label>
              <div className="flex gap-3">
                <Input
                  value={formData.id}
                  onChange={(e) => handleIdChange(e.target.value)}
                  placeholder="Masukkan ID karyawan"
                  className="flex-1 transition-all duration-300 focus:ring-2 focus:ring-honda-red/50"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleCheck}
                  disabled={isChecking || !formData.id.trim() || isLoading}
                  variant={isIdChecked && !idNeedsRecheck ? "default" : "outline"}
                  className={cn(
                    "px-6 transition-all duration-300",
                    isIdChecked && !idNeedsRecheck
                      ? "bg-honda-red hover:bg-honda-red-dark"
                      : "border-honda-red text-honda-red hover:bg-honda-red hover:text-white"
                  )}
                >
                  {isChecking ? "..." : isIdChecked && !idNeedsRecheck ? "Re-cek" : "Cek"}
                </Button>
              </div>
            </div>

            {/* Nama */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Nama</Label>
              <Input
                value={formData.nama || "Belum terisi"}
                readOnly
                className={cn(
                  "bg-muted transition-all duration-300",
                  !formData.nama && "text-muted-foreground"
                )}
              />
            </div>

            {/* Departemen */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">Departemen</Label>
              <Input
                value={formData.departemen || "Belum terisi"}
                readOnly
                className={cn(
                  "bg-muted transition-all duration-300",
                  !formData.departemen && "text-muted-foreground"
                )}
              />
            </div>

            {/* Hidden inputs for form data */}
            <input type="hidden" value={formData.uuid} />
            <input type="hidden" value={formData.fingerprint} />
            <input type="hidden" value={formData.urlMaps} />
            <input type="hidden" value={formData.latitude} />
            <input type="hidden" value={formData.longitude} />

            {/* Tanggal & Jam */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Tanggal</Label>
                <Input
                  value={formData.tanggal}
                  readOnly
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">Jam</Label>
                <Input
                  value={formData.jam}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Presensi Type */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold text-foreground">Keterangan Presensi</Label>
              <RadioGroup
                value={formData.presensi}
                onValueChange={(value) => setFormData({ ...formData, presensi: value })}
                className="grid grid-cols-2 gap-4"
                disabled={!isIdChecked || idNeedsRecheck}
              >
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Hadir" id="datang" />
                  <Label htmlFor="datang" className="cursor-pointer">Datang</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Pulang" id="pulang" />
                  <Label htmlFor="pulang" className="cursor-pointer">Pulang</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Sakit" id="sakit" />
                  <Label htmlFor="sakit" className="cursor-pointer">Sakit</Label>
                </div>
                <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Izin" id="izin" />
                  <Label htmlFor="izin" className="cursor-pointer">Izin</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Camera Section */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Foto Verifikasi</Label>
              
              {!capturedImage ? (
                <Button
                  onClick={startCamera}
                  variant="outline"
                  className="w-full py-8 border-dashed border-2 hover:border-honda-red hover:bg-honda-red/5 transition-all duration-300"
                  disabled={!isCameraEnabled() || isLoading}
                >
                  <CameraIcon className="mr-2 h-6 w-6" />
                  {!isIdChecked || idNeedsRecheck 
                    ? "Lengkapi data terlebih dahulu" 
                    : "Buka Kamera untuk Verifikasi"}
                </Button>
              ) : (
                <Button
                  onClick={() => setPreviewModalOpen(true)}
                  variant="outline"
                  className="w-full py-8 border-dashed border-2 border-green-500 bg-green-50 hover:bg-green-100 transition-all duration-300"
                >
                  <Eye className="mr-2 h-6 w-6 text-green-600" />
                  <span className="text-green-700">Lihat Foto yang Diambil</span>
                </Button>
              )}
            </div>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-honda-red to-transparent opacity-30"></div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              className={cn(
                "w-full py-6 text-lg font-semibold transition-all duration-300 shadow-lg",
                isSubmitEnabled()
                  ? "bg-honda-red hover:bg-honda-red-dark hover:shadow-[var(--shadow-glow)] transform hover:scale-[1.02]"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              disabled={!isSubmitEnabled() || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Submit Presensi"
              )}
            </Button>
          </div>
        </Card>

        {/* Hidden canvas for photo processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Camera Modal */}
      <Dialog open={cameraModalOpen} onOpenChange={setCameraModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CameraIcon className="h-5 w-5 text-honda-red" />
              Ambil Foto Presensi
            </DialogTitle>
            <DialogDescription>
              Pastikan wajah Anda terlihat jelas dalam frame. Sistem akan mendeteksi wajah secara otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover",
                  !isMobile && "transform scale-x-[-1]"
                )}
              />
              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              />

              {/* Face detection status indicator */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all duration-300",
                  faceDetected
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                )}>
                  {faceDetected ? "✓ Wajah Terdeteksi" : "⚠ Arahkan Wajah ke Kamera"}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={capturePhoto}
                disabled={!faceDetected}
                className={cn(
                  "flex-1 py-3 transition-all duration-300",
                  faceDetected
                    ? "bg-honda-red hover:bg-honda-red-dark"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                <CameraIcon className="mr-2 h-5 w-5" />
                {faceDetected ? "Ambil Foto" : "Tunggu Deteksi Wajah"}
              </Button>
              <Button onClick={stopCamera} variant="outline" className="px-6">
                <X className="mr-2 h-4 w-4" />
                Batal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-honda-red" />
              Preview Foto Presensi
            </DialogTitle>
            <DialogDescription>
              Periksa foto Anda sebelum mengirim presensi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-black">
              {capturedImage && (
                <img
                  src={capturedImage}
                  alt="Foto Presensi"
                  className="w-full h-auto max-h-[60vh] object-contain"
                />
              )}
            </div>

            <div className="flex gap-3">
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
              </Button>
              <Button
                onClick={() => setPreviewModalOpen(false)}
                className="bg-honda-red hover:bg-honda-red-dark"
                disabled={isLoading}
              >
                <Check className="mr-2 h-4 w-4" />
                Gunakan Foto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Modal */}
      <Dialog
        open={notification.isOpen}
        onOpenChange={(open) => setNotification(prev => ({ ...prev, isOpen: open }))}
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
            <DialogDescription className="text-left whitespace-pre-wrap">
              {notification.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => setNotification(prev => ({ ...prev, isOpen: false }))}
              className={cn(
                "transition-all duration-300",
                notification.type === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};