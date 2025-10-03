import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress"; // asumsi pakai shadcn/ui progress

interface LoadingScreenProps {
  isOpen: boolean;
  message?: string;
  progress?: number | null; // 0–100, atau null/-1 kalau indeterminate
}

export const LoadingScreen = ({
  isOpen,
  message = "Loading...",
  progress = null,
}: LoadingScreenProps) => {
  const isDeterminate = progress !== null && progress >= 0;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-card/95 shadow-xl">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-honda-red/20 animate-pulse"></div>
              <Loader2 className="w-16 h-16 text-honda-red animate-spin absolute inset-0" />
            </div>

            <h3 className="mt-6 text-lg font-semibold text-foreground">
              {message}
            </h3>

            {/* Kalau progress ada */}
            {isDeterminate && (
              <div className="w-full mt-4">
                <Progress value={progress} />
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {progress}% selesai
                </p>
              </div>
            )}

            {/* Kalau indeterminate */}
            {!isDeterminate && (
              <p className="mt-2 text-sm text-muted-foreground text-center">
                Mohon tunggu sebentar...
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};
