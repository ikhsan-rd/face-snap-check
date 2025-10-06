import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getTanggalSekarang() {
  const now = new Date();
  const tanggalDisplay = now.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const tanggal = now.toISOString().split("T")[0]; // yyyy-MM-dd
  return { tanggalDisplay, tanggal };
}
