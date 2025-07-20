'use client';

import { useRouter } from 'next/navigation';
import FinancialProfileCollection from '@/components/financial-profile-collection';

export default function ChatPage() {
  const router = useRouter();

  const handleComplete = (profileData: Record<string, unknown>) => {
    // Handle completion - could navigate to dashboard or show success
    console.log('Profile completed:', profileData);
    // For now, navigate back to home
    router.push('/');
  };

  const handleCancel = () => {
    // Navigate back to home page
    router.push('/');
  };

  return (
    <div className='h-screen'>
      <FinancialProfileCollection
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
