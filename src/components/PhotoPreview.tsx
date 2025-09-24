import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preview Foto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt="Captured"
              className="w-full h-full object-cover"
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