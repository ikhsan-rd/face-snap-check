import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, X, RefreshCw, CameraIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  faceDetected: boolean;
  isNeedDetected: boolean;
  onCapture: () => void;
  location: string;
  imageUrl: string | null;
  onRetake: () => void;
  mode: "camera" | "preview";
}

export const CameraModal = ({
  isOpen,
  onClose,
  videoRef,
  canvasRef,
  faceDetected,
  isNeedDetected,
  onCapture,
  location,
  imageUrl,
  onRetake,
  mode,
}: CameraModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        hideClose
        className={cn(
          // default mobile fullscreen
          "w-screen h-screen max-w-none rounded-none p-2 flex flex-col justify-around",
          // override di desktop
          "md:max-w-md md:h-auto md:rounded-lg md:p-6"
        )}
      >
        <div className="flex flex-col w-full max-w-sm flex-1 justify-center gap-4 my-auto">
          <DialogHeader className="pl-2 md:p-0">
            <DialogTitle className="flex items-center gap-2">
              <CameraIcon className="h-5 w-5" />
              {mode === "preview"
                ? "Preview Foto Presensi"
                : "Ambil Foto Presensi"}
            </DialogTitle>
            <DialogDescription className="flex">
              Pastikan wajah Anda terlihat jelas dalam frame kamera
            </DialogDescription>
          </DialogHeader>

          <div
            className="relative aspect-[4/5] bg-muted rounded-lg overflow-hidden"
            style={{ maxHeight: '70vh' }}
          >
            {mode === "preview" ? (
              <img
                src={imageUrl}
                alt="Captured"
                loading="lazy"
                className="left-0 right-0 rounded-lg w-full h-full object-cover"
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover md:rounded-lg scale-x-[-1]"
                />

                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                />

                {isNeedDetected && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2">
                    {faceDetected ? (
                      <span className="bg-green-600 text-white text-xs px-3 py-1 rounded-full shadow-md">
                        Wajah ditemukan
                      </span>
                    ) : (
                      <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full shadow-md">
                        Arahkan wajah ke kamera
                      </span>
                    )}
                  </div>
                )}

                <div className="absolute bottom-3 left-3 text-white text-xs pointer-events-none">
                  <div className="  ">
                    <div className="rounded text-shadow">
                      {location ? location : "Mendapatkan lokasi..."}
                    </div>
                    <div className="rounded text-shadow">
                      {new Date().toLocaleString("id-ID")}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {mode === "preview" ? (
              <>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className=" flex-1 text-white hover:text-white bg-blue-600 hover:bg-blue-800"
                >
                  <Check className="w-4 h-4" />
                  Gunakan Foto
                </Button>
                <Button variant="outline" onClick={onRetake}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Ulang
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onCapture}
                  disabled={!faceDetected && isNeedDetected}
                  className="flex-1 bg-honda-red hover:bg-honda-red-dark"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  Ambil Foto
                </Button>
                <Button variant="outline" onClick={onClose}>
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
