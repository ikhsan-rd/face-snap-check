import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetected: boolean;
  onCapture: () => void;
}

export const CameraModal = ({
  isOpen,
  onClose,
  videoRef,
  canvasRef,
  faceDetected,
  onCapture,
}: CameraModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ambil Foto Wajah</DialogTitle>
          <DialogDescription>
            Posisikan wajah Anda di dalam frame dan pastikan pencahayaan cukup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none"
            />
          </div>

          <div className="flex items-center justify-center space-x-2">
            <div
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                faceDetected ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className="text-sm">
              {faceDetected ? "Wajah terdeteksi" : "Posisikan wajah Anda"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={onCapture}
              disabled={!faceDetected}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Ambil Foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};