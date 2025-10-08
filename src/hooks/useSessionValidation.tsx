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
  });

  useEffect(() => {
    if (!currentUser || isLoggingOut) return;

    const validateSession = async () => {
      const uuid = getUUID();
      if (!uuid) return;

      try {
        const response = await checkSession(currentUser.id, uuid);

        if (!response.success && response.forceLogout) {
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
      } catch (error) {
        console.error("Session validation error:", error);
      }
    };

    validateSession();
    const interval = setInterval(validateSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentUser, getUUID, logoutUserGlobal, isLoggingOut]);

  // **Selalu return object**
  return {
    notification,
    closeSessionNotification: () =>
      setNotification((prev) => ({ ...prev, isOpen: false })),
  };
};
