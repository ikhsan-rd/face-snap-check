import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRatio } from "@/config/camera";

interface PhotoPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onDelete: () => void;
  onRetake: () => void;
}

export const PhotoPreview = ({
  isOpen,
  onClose,
  imageUrl,
  onDelete,
  onRetake,
}: PhotoPreviewProps) => {
  const isMobile = useIsMobile();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          isMobile
            ? "w-screen h-screen max-w-none rounded-none p-0"
            : "max-w-md"
        )}
      >
        <DialogHeader>
          <DialogTitle>Preview Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`relative w-full aspect-[${useRatio}] bg-muted rounded-lg overflow-hidden`}
          >
            <img
              src={imageUrl}
              alt="Captured"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onDelete} className="flex-1">
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
            <Button onClick={onRetake} className="flex-1">
              <RefreshCw className="w-4 h-4 mr-2" />
              Ambil Ulang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
