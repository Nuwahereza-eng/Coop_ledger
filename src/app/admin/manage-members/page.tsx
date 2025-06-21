
"use client";

import { useEffect, useState } from 'react';
import AppLayout from '../../AppLayout';
import { Users, Loader2, AlertTriangle } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { getUsers } from '@/services/userService';
import type { Member } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const getStatusBadgeClasses = (status: Member['verificationStatus']) => {
  switch (status) {
    case 'verified': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700';
    case 'unverified': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700';
  }
};

export default function ManageMembersPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isRoleInitialized && userRole !== 'admin') {
      router.replace('/'); 
    } else if (userRole === 'admin') {
      async function fetchMembers() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedMembers = await getUsers();
          setMembers(fetchedMembers);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred.");
          console.error('[ManageMembersPage] Error fetching members:', err);
        } finally {
          setIsLoading(false);
        }
      }
      fetchMembers();
    }
  }, [userRole, isRoleInitialized, router]);

  if (!isRoleInitialized || userRole !== 'admin' || isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {isRoleInitialized && userRole !== 'admin' && <p className="mt-4 text-muted-foreground">Redirecting...</p>}
          {!isRoleInitialized && <p className="mt-4 text-muted-foreground">Initializing...</p>}
          {isLoading && userRole === 'admin' && <p className="mt-4 text-muted-foreground">Loading members...</p>}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
            Manage Members
          </h1>
        </div>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All SACCO Members</CardTitle>
            <CardDescription>
              A complete list of all members on the platform. More management features like approvals and editing are coming soon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!error && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Verification Status</TableHead>
                      <TableHead className="text-right">Credit Score</TableHead>
                      <TableHead className="text-right">Personal Balance (UGX)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.length > 0 ? (
                      members.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusBadgeClasses(member.verificationStatus)}>
                              {member.verificationStatus.charAt(0).toUpperCase() + member.verificationStatus.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{member.creditScore || 'N/A'}</TableCell>
                          <TableCell className="text-right">{member.personalWalletBalance.toLocaleString()}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No members found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
