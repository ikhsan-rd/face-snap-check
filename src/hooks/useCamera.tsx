import { useState, useRef, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

export const useCamera = () => {
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

          const width = x2 - x1;
          const height = y2 - y1;

          ctx.strokeRect(x1, y1, width, height);
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

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const captureCanvas = document.createElement("canvas");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;

    const ctx = captureCanvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = captureCanvas.toDataURL("image/png");
    setCapturedImage(imageData);
    setMode("preview");
  }, []);

  const deletePhoto = useCallback(() => {
    setCapturedImage(null);
    setMode("camera");
  }, []);

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
    deletePhoto,
    retakePhoto,
  };
};
