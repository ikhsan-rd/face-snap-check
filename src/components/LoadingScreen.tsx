import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  isOpen: boolean;
  message?: string;
}

export const LoadingScreen = ({ isOpen, message = "Loading..." }: LoadingScreenProps) => {
  return (
    <Dialog open={isOpen} modal>
      <DialogContent className="sm:max-w-md border-none bg-card/95 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col items-center justify-center py-8 px-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-honda-red/20 animate-pulse"></div>
            <Loader2 className="w-16 h-16 text-honda-red animate-spin absolute inset-0" />
          </div>
          <h3 className="mt-6 text-lg font-semibold text-foreground">
            {message}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Mohon tunggu sebentar...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};