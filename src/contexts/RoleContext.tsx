
'use client';

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'member' | 'admin';

interface RoleContextType {
  userRole: UserRole;
  setUserRole: Dispatch<SetStateAction<UserRole>>;
  isRoleInitialized: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<UserRole>('member');
  const [isRoleInitialized, setIsRoleInitialized] = useState(false);

  useEffect(() => {
    // Simulate fetching role or reading from localStorage, then set initialized
    // For now, just set to member and mark as initialized
    // In a real app, you might read from localStorage or an API
    const storedRole = localStorage.getItem('userRole') as UserRole | null;
    if (storedRole && (storedRole === 'member' || storedRole === 'admin')) {
      setUserRole(storedRole);
    }
    setIsRoleInitialized(true);
  }, []);

  useEffect(() => {
    if (isRoleInitialized) {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole, isRoleInitialized]);


  return (
    <RoleContext.Provider value={{ userRole, setUserRole, isRoleInitialized }}>
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
