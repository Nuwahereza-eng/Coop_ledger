import AppLayout from '../AppLayout';
import { CreditScoreGenerator } from '@/components/features/credit-score/CreditScoreGenerator';

export default function CreditScorePage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-8">
        <CreditScoreGenerator />
      </div>
    </AppLayout>
  );
}
