import { useCallback } from "react";

export const useDeviceIdentity = () => {
  // FIX: Get UUID from localStorage or create new one with fallback
  const getUUID = useCallback(() => {
    try {
      let storedUUID = localStorage.getItem("deviceUUID");
      if (!storedUUID) {
        // FIX: Fallback for browsers without crypto.randomUUID (older mobile browsers)
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          storedUUID = crypto.randomUUID();
        } else {
          // Fallback: generate simple UUID
          storedUUID = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
        localStorage.setItem("deviceUUID", storedUUID);
      }
      return storedUUID;
    } catch (error) {
      console.error("Failed to get/set UUID:", error);
      // Return a session-based UUID if localStorage fails
      return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
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
