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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isDataChecked, setIsDataChecked] = useState(false);

  const clearUserData = () => {
    setUserData(null);
    setIsDataChecked(false);
  };

  return (
    <UserContext.Provider 
      value={{ 
        userData, 
        setUserData, 
        isDataChecked, 
        setIsDataChecked,
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
