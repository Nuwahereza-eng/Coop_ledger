
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
  // Get the complete user state, including the initialization status.
  const { currentUser, isUserInitialized } = useUser();

  // Determine the role based on the current user. Default to 'member'.
  const userRole = currentUser?.role || 'member';

  // Provide the derived role and the initialization status from UserContext to children.
  // The 'isRoleInitialized' property for this context is set using the 'isUserInitialized' variable.
  return (
    <RoleContext.Provider value={{ userRole, isRoleInitialized: isUserInitialized }}>
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
