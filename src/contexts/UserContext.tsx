
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
  const [users, setUsers] = useState<Member[]>(mockUsers);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isUserInitialized, setIsUserInitialized] = useState(false);

  useEffect(() => {
    try {
      const storedUsersItem = localStorage.getItem('users');
      const storedUserItem = localStorage.getItem('currentUser');

      // Step 1: Determine the definitive list of users, with a check for outdated data.
      let definitiveUsers = mockUsers;
      if (storedUsersItem) {
        try {
          const parsedUsers = JSON.parse(storedUsersItem) as Member[];
          // Simple migration: if the first user doesn't have a phone number, the data is old.
          if (Array.isArray(parsedUsers) && parsedUsers.length > 0 && parsedUsers[0]?.phoneNumber) {
            // Data looks new enough, use it.
            definitiveUsers = parsedUsers;
          } else {
            // Data is old. Log it, and fall through to use fresh mockUsers.
            console.log('Outdated user data in localStorage. Re-initializing with fresh mock data.');
          }
        } catch (e) {
          console.error("Failed to parse 'users' from localStorage, falling back to mock data.", e);
          // Fall through to use mockUsers
        }
      }
      
      // If we fell through (or there was no stored data), definitiveUsers is mockUsers. 
      // Let's ensure localStorage is updated to the latest version.
      if (definitiveUsers === mockUsers) {
          localStorage.setItem('users', JSON.stringify(mockUsers));
      }

      setUsers(definitiveUsers);

      // Step 2: Determine the current user based on the definitive list.
      if (storedUserItem && storedUserItem !== 'null' && storedUserItem !== 'undefined') {
        try {
            const storedUser = JSON.parse(storedUserItem) as Member;
            // Find the user in the *definitive* list we just established.
            const userInList = definitiveUsers.find(u => u.id === storedUser.id);
            setCurrentUser(userInList || null);
        } catch(e) {
            console.error("Failed to parse 'currentUser' from localStorage", e);
            setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
        console.error("An unexpected error occurred during user initialization:", error);
        setCurrentUser(null);
        setUsers(mockUsers);
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
