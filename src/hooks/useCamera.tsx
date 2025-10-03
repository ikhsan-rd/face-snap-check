import { useState, useRef, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import { useIsMobile } from "./use-mobile";
import { useRatio } from "@/config/camera";

export const useCamera = (location?: string) => {
  const [mode, setMode] = useState<"camera" | "preview">("camera");

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [model, setModel] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectionsRef = useRef<any[]>([]);

  const isMobile = useIsMobile();

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

  // Initialize camera when modal opens
  useEffect(() => {
    async function startCamera() {
      try {
        const ratio = eval(useRatio);

        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", aspectRatio: ratio },
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
    if (cameraModalOpen && mode === "camera") startCamera();
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
  }, [cameraModalOpen, mode]);

  // Face detection loop
  useEffect(() => {
    let rafId: number;
    let running = true;

    // Face detection loop
    async function loop() {
      if (!running) return;

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

      // Gunakan ukuran tampilan elemen video, bukan ukuran sensor
      const displayWidth = video.clientWidth;
      const displayHeight = video.clientHeight;
      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Buat canvas offscreen untuk crop sesuai tampilan
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = displayWidth;
      offscreenCanvas.height = displayHeight;
      const offCtx = offscreenCanvas.getContext("2d");
      if (!offCtx) return;

      // Gambar video sesuai tampilan yang terlihat
      offCtx.drawImage(video, 0, 0, displayWidth, displayHeight);

      // Gunakan frame hasil crop untuk deteksi
      const imageData = offCtx.getImageData(0, 0, displayWidth, displayHeight);
      const predictions = await model.estimateFaces(imageData, false);

      const detected = predictions && predictions.length > 0;
      setFaceDetected(detected);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (detected) {
        ctx.strokeStyle = "rgba(34,197,94,0.9)";
        ctx.lineWidth = 3;

        predictions.forEach((pred: any) => {
          const [x1, y1] = pred.topLeft;
          const [x2, y2] = pred.bottomRight;

          ctx.strokeStyle = "rgba(34,197,94,0.9)";
          ctx.lineWidth = 3;
          ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        });
      }

      if (running) rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [cameraModalOpen, model]);

  // Fungsi helper untuk membungkus teks panjang
  function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ) {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";

    words.forEach((word) => {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
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
    if (!videoRef.current) return;

    const video = videoRef.current;

    const maxWidth = 640; // target lebar
    const scale = video.videoWidth > maxWidth ? maxWidth / video.videoWidth : 1;

    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth * scale;
    captureCanvas.height = video.videoHeight * scale;

    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return;

    // === Gambar video ===
    if (!isMobile) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        -captureCanvas.width,
        0,
        captureCanvas.width,
        captureCanvas.height
      );
      ctx.restore(); // reset biar teks tidak ikut mirror
    } else {
      ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    }

    // === Overlay teks ===
    const currentTime = new Date().toLocaleString("id-ID");
    const locationText = location || "Lokasi tidak tersedia";

    const fontSize = Math.max(13, captureCanvas.width / 35);
    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = "white";

    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    const padding = 19;
    const lineHeight = fontSize * 1.4;

    const wrappedLocation = wrapText(
      ctx,
      locationText,
      captureCanvas.width - padding * 2
    );

    const lines = [...wrappedLocation, currentTime];
    const startY = captureCanvas.height - padding;

    lines.forEach((line, index) => {
      const y = startY - (lines.length - 1 - index) * lineHeight;
      ctx.fillText(line, padding, y);
    });

    // Simpan hasil gambar
    const imageData = captureCanvas.toDataURL("image/jpeg", 0.7);

    // hitung ukuran file
    function dataURLtoBlob(dataurl: string) {
      const arr = dataurl.split(",");
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new Blob([u8arr], { type: mime });
    }

    const blob = dataURLtoBlob(imageData);
    console.log("Ukuran gambar:", (blob.size / 1024).toFixed(2), "KB");

    setCapturedImage(imageData);
    setMode("preview");
  }, [isMobile, location]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setMode("camera");
  }, []);

  return {
    cameraActive,
    setCameraActive,
    cameraModalOpen,
    setCameraModalOpen,
    capturedImage,
    setCapturedImage,
    faceDetected,
    model,
    videoRef,
    canvasRef,
    streamRef,
    rafRef,
    detectionsRef,
    capturePhoto,
    retakePhoto,
    mode,
    setMode,
  };
};
