
'use client';

import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';
import { useUser } from './UserContext';

export type UserRole = 'member' | 'admin';

interface RoleContextType {
  userRole: UserRole;
  isRoleInitialized: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  // Get the complete user state, including initialization status, from the UserContext.
  const { currentUser, isUserInitialized } = useUser();

  // Determine the role based on the current user. Default to 'member'.
  const userRole = currentUser?.role || 'member';

  // Provide the derived role and the initialization status to children.
  // The 'isRoleInitialized' here comes directly from the useUser() hook.
  return (
    <RoleContext.Provider value={{ userRole, isRoleInitialized }}>
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
