import AppLayout from '../../AppLayout';
import { CreateWalletForm } from '@/components/features/wallets/CreateWalletForm';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CreateWalletPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/wallets">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallets
          </Link>
        </Button>
        <div className="flex justify-center">
         <CreateWalletForm />
        </div>
      </div>
    </AppLayout>
  );
}
