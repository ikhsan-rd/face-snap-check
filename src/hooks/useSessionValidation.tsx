import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkSession, getCurrentUser } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { useDeviceIdentity } from "@/hooks/useDeviceIdentity";

export const useSessionValidation = () => {
  const navigate = useNavigate();
  const { clearUserData } = useUser();
  const currentUser = getCurrentUser();
  const { getUUID } = useDeviceIdentity();
  
  const [sessionNotification, setSessionNotification] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
  });

  useEffect(() => {
    // Hanya jalankan jika user sudah login
    if (!currentUser) return;

    const validateSession = async () => {
      const uuid = getUUID();
      if (!uuid) return;

      try {
        const response = await checkSession(currentUser.id, uuid);
        
        if (!response.success) {
          // Session invalid - tampilkan notifikasi
          setSessionNotification({
            isOpen: true,
            type: "error",
            title: "Sesi Kadaluarsa",
            message: response.message || "Sesi Anda telah kadaluarsa, silakan login kembali",
          });
          
          // Tunggu 2 detik untuk user baca notifikasi, lalu paksa logout
          setTimeout(() => {
            clearUserData();
            navigate("/presensi");
          }, 2000);
        }
      } catch (error) {
        console.error("Session validation error:", error);
        // Silent fail - jangan ganggu user experience jika cuma network error
      }
    };

    // Check saat mount (component pertama kali load)
    validateSession();

    // Check berkala setiap 5 menit
    const interval = setInterval(validateSession, 5 * 60 * 1000);

    // Cleanup interval saat unmount
    return () => clearInterval(interval);
  }, [currentUser, navigate, clearUserData, getUUID]);

  return {
    sessionNotification,
    closeSessionNotification: () => 
      setSessionNotification({ ...sessionNotification, isOpen: false }),
  };
};
