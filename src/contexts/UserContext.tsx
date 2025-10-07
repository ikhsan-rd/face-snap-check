import React, { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/services/api";
import { useDeviceIdentity } from "@/hooks/useDeviceIdentity";

export interface UserData {
  id: string;
  nama: string;
  departemen: string;
}

interface UserContextType {
  userData: UserData | null;
  isDataChecked: boolean;
  setIsDataChecked: (checked: boolean) => void;
  clearUserData: () => void;
  logoutUserGlobal: () => Promise<void>;
  loginUserGlobal: (data: UserData) => void;
  isLoggingOut: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { getUUID } = useDeviceIdentity();

  const [userData, setUserData] = useState<UserData | null>(() => {
    // FIX: Wrap localStorage access in try-catch for Safari private mode
    try {
      const saved = localStorage.getItem("userData");
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load userData from localStorage:", error);
      return null;
    }
  });

  const [isDataChecked, setIsDataChecked] = useState(() => {
    // FIX: Wrap localStorage access in try-catch for Safari private mode
    try {
      const saved = localStorage.getItem("isDataChecked");
      return saved === "true";
    } catch (error) {
      console.error("Failed to load isDataChecked from localStorage:", error);
      return false;
    }
  });

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  React.useEffect(() => {
    const syncUserData = () => {
      // FIX: Wrap localStorage access in try-catch
      try {
        const saved = localStorage.getItem("userData");
        setUserData(saved ? JSON.parse(saved) : null);

        const checked = localStorage.getItem("isDataChecked");
        setIsDataChecked(checked === "true");
      } catch (error) {
        console.error("Failed to sync userData:", error);
      }
    };

    // Jalankan saat pertama kali mount (kalau belum sinkron)
    syncUserData();

    // Dengarkan perubahan localStorage dari event lain (termasuk tab lain)
    window.addEventListener("storage", syncUserData);

    return () => {
      window.removeEventListener("storage", syncUserData);
    };
  }, []);

  const loginUserGlobal = (data: UserData) => {
    // FIX: Wrap localStorage write in try-catch
    try {
      localStorage.setItem("userData", JSON.stringify(data));
      localStorage.setItem("isDataChecked", "true");
      setUserData(data);
      setIsDataChecked(true);
    } catch (error) {
      console.error("Failed to save userData to localStorage:", error);
      // Still update state even if localStorage fails
      setUserData(data);
      setIsDataChecked(true);
    }
  };

  const handleSetIsDataChecked = (checked: boolean) => {
    setIsDataChecked(checked);
    // FIX: Wrap localStorage write in try-catch
    try {
      localStorage.setItem("isDataChecked", checked.toString());
    } catch (error) {
      console.error("Failed to save isDataChecked to localStorage:", error);
    }
  };

  const clearUserData = () => {
    setUserData(null);
    setIsDataChecked(false);
  };

  const logoutUserGlobal = async () => {
    if (!userData) {
      clearUserData();
      navigate("/presensi");
      return;
    }

    setIsLoggingOut(true);

    try {
      // panggil backend logout
      const uuid = getUUID();
      const response = await logoutUser(userData.id, uuid);

      // backend selalu berhasil, jadi clear data
      clearUserData();

      // bisa tambahkan notifikasi di sini jika mau
      console.info("Logout:", response.message || "Logout berhasil");

      navigate("/presensi");
    } catch (error) {
      console.error("Gagal logout:", error);
      clearUserData(); // tetap bersihkan agar aman
      navigate("/presensi");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        isDataChecked,
        setIsDataChecked: handleSetIsDataChecked,
        clearUserData,
        logoutUserGlobal,
        isLoggingOut,
        loginUserGlobal,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
