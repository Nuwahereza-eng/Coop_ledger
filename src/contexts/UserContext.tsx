
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
      const storedUserItem = localStorage.getItem('currentUser');
      const storedUsersItem = localStorage.getItem('users');

      let currentUsers = mockUsers;
      if (storedUsersItem) {
          const storedUsers = JSON.parse(storedUsersItem);
          // Quick validation - allow for more users than the mock list if new ones were created
          if(Array.isArray(storedUsers) && storedUsers.length >= mockUsers.length) {
            currentUsers = storedUsers;
            setUsers(storedUsers);
          }
      }

      if (storedUserItem && storedUserItem !== 'null' && storedUserItem !== 'undefined') {
        const storedUser = JSON.parse(storedUserItem) as Member;
        const userInList = currentUsers.find(u => u.id === storedUser.id);
        setCurrentUser(userInList || null);
      } else {
        // No user in local storage, so currentUser remains null
        setCurrentUser(null);
      }
    } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setCurrentUser(null);
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
