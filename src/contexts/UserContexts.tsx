import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { PopulatedUser } from '@/constants';
import { jsonStringToUser } from '@/lib';

interface UserContextProps {
  user: PopulatedUser | null;
  email: string | null;
  setEmail: React.Dispatch<React.SetStateAction<string | null>>;
  setUser: React.Dispatch<React.SetStateAction<PopulatedUser | null>>;
  logout: () => Promise<void>;
  loadingUser: boolean;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<PopulatedUser | null>(null);

  useEffect(() => {
    const localStorageUser = localStorage.getItem('authUser');
    const localStorageEmail = localStorage.getItem('authEmail');

    if (localStorageUser) {
      const savedUser = jsonStringToUser(localStorageUser);
      if (savedUser) {
        setUser(savedUser);
      }
    }

    if (localStorageEmail) {
      setEmail(localStorageEmail);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }

    if (email) {
      localStorage.setItem('authEmail', email);
    } else {
      localStorage.removeItem('authEmail');
    }
  }, [user, email]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setEmail(null);
    setLoading(false);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authEmail');
    window.location.href = '/';
  };

  return (
    <UserContext.Provider value={{ user, email, setUser, setEmail, logout, loadingUser: loading }}>
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

export default UserContext;
