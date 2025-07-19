'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { TrendingUp, Shield, Target, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import AuthModal from '@/components/auth/auth-modal';

export default function Home() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGetStarted = () => {
    if (user) {
      // User is authenticated, proceed to chat
      const sessionId = uuidv4();
      router.push(`/chat/${sessionId}`);
    } else {
      // User not authenticated, show sign-in modal
      setShowAuthModal(true);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50'>
      {isMobile && (
        <div className='fixed left-0 top-0 m-1 z-50'>
          <SidebarTrigger className='rounded-full bg-gray-200 p-4' />
        </div>
      )}

      <div className='flex-1 flex items-center justify-center px-4'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Hero Section */}
          <div className='mb-8'>
            <h1 className='text-4xl md:text-6xl font-bold text-gray-900 mb-6'>
              Your Personal{' '}
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600'>
                Financial Advisor
              </span>
            </h1>
            <p className='text-xl text-gray-600 mb-8 max-w-2xl mx-auto'>
              Get personalized financial advice powered by AI. Share your
              financial goals, and receive tailored recommendations to build
              your wealth and secure your future.
            </p>
          </div>

          {/* Features Grid */}
          <div className='grid md:grid-cols-3 gap-8 mb-12'>
            <div className='p-6 bg-white rounded-xl shadow-lg border border-gray-100'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
                <TrendingUp className='w-6 h-6 text-blue-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Smart Analysis
              </h3>
              <p className='text-gray-600 text-sm'>
                AI-powered insights into your spending patterns and investment
                opportunities
              </p>
            </div>

            <div className='p-6 bg-white rounded-xl shadow-lg border border-gray-100'>
              <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
                <Shield className='w-6 h-6 text-purple-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Secure & Private
              </h3>
              <p className='text-gray-600 text-sm'>
                Your financial data is encrypted and never shared with third
                parties
              </p>
            </div>

            <div className='p-6 bg-white rounded-xl shadow-lg border border-gray-100'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto'>
                <Target className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-lg font-semibold text-gray-900 mb-2'>
                Goal-Oriented
              </h3>
              <p className='text-gray-600 text-sm'>
                Set and track your financial goals with personalized action
                plans
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className='bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-2xl mx-auto'>
            <h2 className='text-2xl font-bold text-gray-900 mb-4'>
              Ready to Transform Your Financial Future?
            </h2>
            <p className='text-gray-600 mb-6'>
              Create your personalized financial profile in just 5-10 minutes.
              Get insights, recommendations, and a clear path to your financial
              goals.
            </p>
            <div className='flex items-center justify-center gap-4'>
              <Button
                onClick={handleGetStarted}
                size='lg'
                className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105'
              >
                Get Started
              </Button>
              {user && (
                <Button
                  onClick={signOut}
                  variant='outline'
                  size='lg'
                  className='px-6 py-3 text-lg font-semibold rounded-xl'
                >
                  <LogOut className='w-5 h-5 mr-2' />
                  Sign Out
                </Button>
              )}
            </div>
            <p className='text-sm text-gray-500 mt-4'>
              {user
                ? `Welcome back, ${user.email}! • Ready to continue your financial journey?`
                : 'No credit card required • 100% free to start'}
            </p>
          </div>

          {/* Trust Indicators */}
          <div className='mt-12 flex items-center justify-center gap-8 text-gray-400'>
            <div className='flex items-center gap-2'>
              <Users className='w-4 h-4' />
              <span className='text-sm'>Trusted by thousands</span>
            </div>
            <div className='flex items-center gap-2'>
              <Shield className='w-4 h-4' />
              <span className='text-sm'>Bank-level security</span>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}
