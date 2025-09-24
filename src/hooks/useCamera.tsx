import { useState, useRef, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

export const useCamera = () => {
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

      // Get the display size of video element
      const rect = video.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const predictions = await model.estimateFaces(video, false);
        if (!running) return;

        const detected = predictions && predictions.length > 0;
        setFaceDetected(detected);

        if (detected) {
          // Calculate scale factors
          const scaleX = canvas.width / video.videoWidth;
          const scaleY = canvas.height / video.videoHeight;

          ctx.strokeStyle = "rgba(34,197,94,0.9)";
          ctx.lineWidth = 3;

          predictions.forEach((pred: any) => {
            const [x1, y1] = pred.topLeft;
            const [x2, y2] = pred.bottomRight;

            // Scale coordinates to canvas size
            const scaledX1 = x1 * scaleX;
            const scaledY1 = y1 * scaleY;
            const scaledX2 = x2 * scaleX;
            const scaledY2 = y2 * scaleY;

            const width = scaledX2 - scaledX1;
            const height = scaledY2 - scaledY1;

            ctx.strokeRect(scaledX1, scaledY1, width, height);
          });
        }
      } catch (err) {
        console.error("Face detection error:", err);
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
    setCameraModalOpen(false);
  }, []);

  const deletePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setCameraModalOpen(true);
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
    retakePhoto
  };
};