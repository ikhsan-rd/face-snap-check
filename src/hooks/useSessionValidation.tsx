import { useEffect, useState } from "react";
import { checkSession, getCurrentUser } from "@/services/api";
import { useUser } from "@/contexts/UserContext";
import { useDeviceIdentity } from "@/hooks/useDeviceIdentity";
import { NotificationDialog } from "@/components/NotificationDialog";

export const useSessionValidation = () => {
  const { isLoggingOut, logoutUserGlobal } = useUser();
  const currentUser = getCurrentUser();
  const { getUUID } = useDeviceIdentity();

  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "error",
    title: "",
    message: "",
    onConfirm: undefined,
  });

  if (isLoggingOut) {
    return {
      notification,
      closeSessionNotification: () =>
        setNotification({ ...notification, isOpen: false }),
    };
  }

  useEffect(() => {
    // Hanya jalankan jika user sudah login
    if (!currentUser) return;

    console.log("Starting session validation for user:", currentUser.id);

    const validateSession = async () => {
      const uuid = getUUID();
      if (!uuid) return;

      try {
        const response = await checkSession(currentUser.id, uuid);

        if (!response.success) {
          if (response.forceLogout) {
            setNotification({
              isOpen: true,
              type: "error",
              title: "Sesi Kadaluarsa",
              message:
                response.message ||
                "Sesi Anda telah kadaluarsa, silakan login kembali",
              onConfirm: async () => {
                await logoutUserGlobal();
              },
            });
          }
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
  }, [currentUser, logoutUserGlobal, getUUID]);
};
