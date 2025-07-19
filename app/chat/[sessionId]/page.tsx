'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import FinancialProfileCollection from '@/components/financial-profile-collection';
import { ChatService, ProfileService } from '@/lib/supabase';
import type { ChatSession, UserProfile } from '@/lib/supabase';

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const sessionId = params.sessionId as string;

  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef<string | null>(null); // Track which sessionId is being initialized

  useEffect(() => {
    const initializeSession = async () => {
      // Prevent duplicate initialization for the same session
      if (authLoading || !user || initializingRef.current === sessionId) return;

      // Mark this sessionId as being initialized
      initializingRef.current = sessionId;

      try {
        setIsLoading(true);
        setError(null);

        // Check if session exists first (before creating profile to avoid duplicates)
        const existingSession = await ChatService.getChatSession(sessionId);

        if (existingSession) {
          // Session exists, just use it
          setChatSession(existingSession);

          // Get user profile
          const profile = await ProfileService.getCurrentUserProfile();
          setUserProfile(profile);
        } else {
          // Session doesn't exist, create new one
          // Get or create user profile first
          const profile = await ProfileService.getOrCreateUserProfile();
          setUserProfile(profile);

          // Create new session with the specific sessionId from URL
          const newSession = await ChatService.createChatSession(
            profile?.id,
            'Financial Profile Session',
            sessionId
          );

          if (!newSession) {
            throw new Error('Failed to create chat session');
          }

          setChatSession(newSession);
        }
      } catch (err) {
        console.error('Error initializing session:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to initialize session'
        );
      } finally {
        setIsLoading(false);
        // Reset the initializing flag
        initializingRef.current = null;
      }
    };

    initializeSession();
  }, [authLoading, user?.id, sessionId]); // Use user.id instead of user object to prevent unnecessary re-runs

  const handleComplete = async (profileData: Record<string, unknown>) => {
    if (!user || !chatSession) return;

    try {
      // Update user profile with final data
      await ProfileService.updateUserProfile(
        profileData as Record<string, unknown>,
        true // Mark as complete
      );

      // Mark session as completed
      await ChatService.markSessionCompleted(chatSession.id);

      console.log('Profile completed:', profileData);
      // Navigate to a success page or dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing profile:', error);
    }
  };

  const handleCancel = () => {
    // Navigate back to home page
    router.push('/');
  };

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  // Show loading while checking auth or initializing session
  if (authLoading || isLoading) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading session...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting unauthenticated users
  if (!user) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Redirecting...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='h-screen flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold text-red-600 mb-2'>Error</h1>
          <p className='text-muted-foreground mb-4'>{error}</p>
          <button
            onClick={() => router.push('/')}
            className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90'
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Debug log for development
  console.log('User Profile:', userProfile);
  console.log('Chat Session:', chatSession);

  return (
    <div className='h-screen'>
      <FinancialProfileCollection
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  );
}
