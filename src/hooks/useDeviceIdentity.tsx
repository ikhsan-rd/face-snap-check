import { useCallback } from "react";

export const useDeviceIdentity = () => {
  // Get UUID from localStorage or create new one
  const getUUID = useCallback(() => {
    let storedUUID = localStorage.getItem("deviceUUID");
    if (!storedUUID) {
      storedUUID = crypto.randomUUID();
      localStorage.setItem("deviceUUID", storedUUID);
    }
    return storedUUID;
  }, []);

  // Get device fingerprint (simplified version)
  const getFingerprint = useCallback(async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("Device fingerprint", 2, 2);
      }
      const canvasFingerprint = canvas.toDataURL();

      const fingerprint = btoa(
        navigator.userAgent +
          navigator.language +
          screen.width +
          screen.height +
          new Date().getTimezoneOffset() +
          canvasFingerprint.slice(-50)
      ).slice(0, 20);

      return fingerprint;
    } catch (error) {
      console.error("Error generating fingerprint:", error);
      return "unknown";
    }
  }, []);

  // Generate device identity
  const getDeviceIdentity = useCallback(async () => {
    const uuid = getUUID();
    const fingerprint = await getFingerprint();
    return { uuid, fingerprint };
  }, [getUUID, getFingerprint]);

  return {
    getUUID,
    getFingerprint,
    getDeviceIdentity,
  };
};
