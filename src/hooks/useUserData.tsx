import { useState, useCallback } from "react";
import { cekUser } from "@/services/api";
import { UserData } from "@/contexts/UserContext";

export const useUserData = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isIdChecked, setIsIdChecked] = useState(false);
  const [idNeedsRecheck, setIdNeedsRecheck] = useState(false);

  // Fetch user data using the API service
  const fetchUserData = useCallback(
    async (id: string): Promise<UserData | null> => {
      try {
        const response = await cekUser(id);

        if (response.success && response.data?.exists) {
          return {
            id: response.data.id,
            nama: response.data.nama,
            departemen: response.data.departemen,
          };
        }

        return null;
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        throw error;
      }
    },
    []
  );

  return {
    isChecking,
    setIsChecking,
    isIdChecked,
    setIsIdChecked,
    idNeedsRecheck,
    setIdNeedsRecheck,
    fetchUserData,
  };
};
