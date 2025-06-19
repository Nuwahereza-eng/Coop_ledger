import AppLayout from '../AppLayout';
import { VerificationForm } from '@/components/features/member-verification/VerificationForm';

export default function VerifyPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-8">
        <VerificationForm />
      </div>
    </AppLayout>
  );
}
