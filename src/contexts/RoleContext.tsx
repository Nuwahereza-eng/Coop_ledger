
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext, useCallback } from 'react';
import { useUser } from './UserContext'; // Import the new UserContext hook

export type UserRole = 'member' | 'admin';

interface RoleContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void; // Simplified setter
  isRoleInitialized: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { currentUser, setCurrentUser, users, isUserInitialized } = useUser();

  const userRole = currentUser?.role || 'member';

  // This function now switches to the *next available user* with the desired role.
  const setUserRole = useCallback((role: UserRole) => {
    const currentIndex = users.findIndex(u => u.id === currentUser?.id);
    // Start searching from the next user
    let nextIndex = (currentIndex + 1) % users.length;
    
    // Loop through users to find the next one with the desired role
    for (let i = 0; i < users.length; i++) {
      const userToTest = users[nextIndex];
      if (userToTest.role === role) {
        setCurrentUser(userToTest);
        return; // Found and set the user, exit
      }
      nextIndex = (nextIndex + 1) % users.length;
    }
    
    // Fallback if no other user with that role is found
    console.warn(`No other user with role "${role}" found to switch to.`);

  }, [currentUser, users, setCurrentUser]);


  return (
    <RoleContext.Provider value={{ userRole, setUserRole, isRoleInitialized: isUserInitialized }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
