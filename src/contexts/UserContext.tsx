
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Member } from '@/types';
import { mockUsers } from '@/lib/mockData';

interface UserContextType {
  currentUser: Member | null;
  setCurrentUser: Dispatch<SetStateAction<Member | null>>;
  users: Member[];
  isUserInitialized: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users] = useState<Member[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isUserInitialized, setIsUserInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedUserItem = localStorage.getItem('currentUser');
      if (storedUserItem) {
        const storedUser = JSON.parse(storedUserItem) as Member;
        // Verify if the stored user is still in our mock list
        if (users.find(u => u.id === storedUser.id)) {
            setCurrentUser(storedUser);
        } else {
            setCurrentUser(users[0] || null);
        }
      } else {
        setCurrentUser(users[0] || null);
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setCurrentUser(users[0] || null);
    } finally {
        setIsUserInitialized(true);
    }
  }, [users]);

  useEffect(() => {
    if (currentUser && isUserInitialized) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
  }, [currentUser, isUserInitialized]);

  const value = { currentUser, setCurrentUser, users, isUserInitialized };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
