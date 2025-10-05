import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserData {
  id: string;
  nama: string;
  departemen: string;
}

interface UserContextType {
  userData: UserData | null;
  setUserData: (data: UserData | null) => void;
  isDataChecked: boolean;
  setIsDataChecked: (checked: boolean) => void;
  clearUserData: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userData, setUserData] = useState<UserData | null>(() => {
    // Load dari localStorage saat inisialisasi
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isDataChecked, setIsDataChecked] = useState(() => {
    // Load status dari localStorage
    const saved = localStorage.getItem('isDataChecked');
    return saved === 'true';
  });

  const handleSetUserData = (data: UserData | null) => {
    setUserData(data);
    if (data) {
      localStorage.setItem('userData', JSON.stringify(data));
    } else {
      localStorage.removeItem('userData');
    }
  };

  const handleSetIsDataChecked = (checked: boolean) => {
    setIsDataChecked(checked);
    localStorage.setItem('isDataChecked', checked.toString());
  };

  const clearUserData = () => {
    setUserData(null);
    setIsDataChecked(false);
    localStorage.removeItem('userData');
    localStorage.removeItem('isDataChecked');
  };

  return (
    <UserContext.Provider 
      value={{ 
        userData, 
        setUserData: handleSetUserData, 
        isDataChecked, 
        setIsDataChecked: handleSetIsDataChecked,
        clearUserData 
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
