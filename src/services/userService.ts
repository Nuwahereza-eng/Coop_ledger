
import { mockUsers } from '@/lib/mockData';
import type { Member } from '@/types';

/**
 * Fetches all users from the mock data.
 * In a real application, this would fetch from a 'users' collection in Firestore.
 * @returns A promise that resolves to an array of all Member objects.
 */
export async function getUsers(): Promise<Member[]> {
  console.log(`[UserService] Attempting to fetch all users from mock data.`);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50)); 
  return mockUsers;
}


/**
 * Fetches a user by their ID from the mock data.
 * In a real application, this would fetch from a 'users' collection in Firestore.
 * @param id The ID of the user to fetch.
 * @returns A promise that resolves to the Member object or null if not found.
 */
export async function getUserById(id: string): Promise<Member | null> {
  console.log(`[UserService] Attempting to fetch user by ID from mock data: ${id}`);
  const user = mockUsers.find(u => u.id === id);
  if (user) {
    console.log(`[UserService] Found user ${id}:`, user);
    return user;
  } else {
    console.warn(`[UserService] User with id ${id} not found in mock data.`);
    return null;
  }
}
