
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Member } from '@/types';
import { mockUsers } from '@/lib/mockData';

interface UserContextType {
  currentUser: Member | null;
  setCurrentUser: Dispatch<SetStateAction<Member | null>>;
  users: Member[];
  addUser: (user: Member) => void;
  updateCurrentUser: (updatedData: Partial<Member>) => void;
  isUserInitialized: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Member[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isUserInitialized, setIsUserInitialized] = useState(false);

  useEffect(() => {
    try {
      // 1. Start with the base mock users as the source of truth for default accounts.
      const definitiveUsers = [...mockUsers];
      const definitiveUserMap = new Map(definitiveUsers.map(u => u.id));
      
      // 2. Load any additional users from localStorage (e.g., accounts created via signup).
      const storedUsersItem = localStorage.getItem('users');
      if (storedUsersItem) {
          try {
              const parsedUsers = JSON.parse(storedUsersItem) as Member[];
              if (Array.isArray(parsedUsers)) {
                  for (const storedUser of parsedUsers) {
                      // Add stored user only if they are not in the base mock list and have a valid structure.
                      if (!definitiveUserMap.has(storedUser.id) && storedUser.id && storedUser.phoneNumber) {
                          definitiveUsers.push(storedUser);
                          definitiveUserMap.set(storedUser.id, storedUser);
                      }
                  }
              }
          } catch (e) {
              console.error("Could not parse 'users' from localStorage. Re-initializing.", e);
          }
      }

      // 3. Set the combined user list and persist it back. This synchronizes localStorage with the latest mock data.
      setUsers(definitiveUsers);
      localStorage.setItem('users', JSON.stringify(definitiveUsers));

      // 4. Load the current user and ensure they exist in our definitive list.
      const storedUserItem = localStorage.getItem('currentUser');
      if (storedUserItem && storedUserItem !== 'null' && storedUserItem !== 'undefined') {
        try {
          const storedUser = JSON.parse(storedUserItem) as Member;
          // Find the user in our definitive list to ensure data is fresh.
          const freshUser = definitiveUserMap.get(storedUser.id);
          setCurrentUser(freshUser || null);
        } catch (e) {
          console.error("Failed to parse 'currentUser' from localStorage", e);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }

    } catch (error) {
        console.error("An unexpected error occurred during user initialization:", error);
        // Fallback to safe state
        setCurrentUser(null);
        setUsers(mockUsers);
        localStorage.setItem('users', JSON.stringify(mockUsers));
    } finally {
        setIsUserInitialized(true);
    }
  }, []);

  const addUser = useCallback((newUser: Member) => {
    setUsers(prevUsers => {
        const newUsers = [...prevUsers, newUser];
        localStorage.setItem('users', JSON.stringify(newUsers));
        return newUsers;
    });
  }, []);

  const updateCurrentUser = useCallback((updatedData: Partial<Member>) => {
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const newCurrentUser = { ...prevUser, ...updatedData };
        
        // Also update the user in the main list
        setUsers(prevUsers => {
            const newUsers = prevUsers.map(u => u.id === newCurrentUser.id ? newCurrentUser : u);
            // Persist updated users list to localStorage
            localStorage.setItem('users', JSON.stringify(newUsers));
            return newUsers;
        });
        
        return newCurrentUser;
    });
  }, []);


  useEffect(() => {
    if (isUserInitialized) {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
    }
  }, [currentUser, isUserInitialized]);

  const value = { currentUser, setCurrentUser, users, addUser, updateCurrentUser, isUserInitialized };

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
