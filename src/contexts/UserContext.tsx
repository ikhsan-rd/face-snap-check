import React, { createContext, useContext, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/services/api";

export interface UserData {
  id: string;
  nama: string;
  departemen: string;
}

interface UserContextType {
  isDataChecked: boolean;
  setIsDataChecked: (checked: boolean) => void;
  clearUserData: () => void;
  logoutUserGlobal: () => Promise<void>;
  isLoggingOut: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();

  const [userData, setUserData] = useState<UserData | null>(() => {
    // Load dari localStorage saat inisialisasi
    const saved = localStorage.getItem("userData");
    return saved ? JSON.parse(saved) : null;
  });

  const [isDataChecked, setIsDataChecked] = useState(() => {
    // Load status dari localStorage
    const saved = localStorage.getItem("isDataChecked");
    return saved === "true";
  });

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSetIsDataChecked = (checked: boolean) => {
    setIsDataChecked(checked);
    localStorage.setItem("isDataChecked", checked.toString());
  };

  const clearUserData = () => {
    setUserData(null);
    setIsDataChecked(false);
  };

  const logoutUserGlobal = async () => {
    if (!userData) {
      clearUserData();
      navigate("/login");
      return;
    }

    setIsLoggingOut(true);

    try {
      // panggil backend logout
      const response = await logoutUser(userData.id);

      // backend selalu berhasil, jadi clear data
      clearUserData();

      // bisa tambahkan notifikasi di sini jika mau
      console.info("Logout:", response.message || "Logout berhasil");

      navigate("/login");
    } catch (error) {
      console.error("Gagal logout:", error);
      clearUserData(); // tetap bersihkan agar aman
      navigate("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        isDataChecked,
        setIsDataChecked: handleSetIsDataChecked,
        clearUserData,
        logoutUserGlobal,
        isLoggingOut,
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
