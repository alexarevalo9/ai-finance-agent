'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import { Mail, Lock, User, AlertCircle, Check } from 'lucide-react';

interface AuthFormProps {
  mode?: 'signin' | 'signup';
  onModeChange?: (mode: 'signin' | 'signup') => void;
}

const AuthForm: React.FC<AuthFormProps> = ({
  mode = 'signin',
  onModeChange,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user && !data.user.email_confirmed_at) {
          setMessage({
            type: 'success',
            text: 'Check your email for the confirmation link!',
          });
        } else {
          setMessage({
            type: 'success',
            text: 'Account created successfully!',
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        setMessage({
          type: 'success',
          text: 'Signed in successfully!',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'An error occurred with Google sign in',
      });
      setLoading(false);
    }
  };

  return (
    <div className='w-full max-w-md mx-auto'>
      <div className='bg-white rounded-xl shadow-lg p-8'>
        <div className='text-center mb-8'>
          <h2 className='text-2xl font-bold text-gray-900 mb-2'>
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className='text-gray-600'>
            {mode === 'signin'
              ? 'Sign in to continue your financial journey'
              : 'Start your personalized financial planning'}
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-green-50 border border-green-200 text-green-700'
            }`}
          >
            {message.type === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <Check size={20} />
            )}
            <span className='text-sm'>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className='space-y-6'>
          {mode === 'signup' && (
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Full Name
              </label>
              <div className='relative'>
                <User
                  className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  size={20}
                />
                <Input
                  type='text'
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder='Enter your full name'
                  className='pl-10'
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Email Address
            </label>
            <div className='relative'>
              <Mail
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={20}
              />
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Enter your email'
                className='pl-10'
                required
              />
            </div>
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Password
            </label>
            <div className='relative'>
              <Lock
                className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                size={20}
              />
              <Input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Enter your password'
                className='pl-10'
                required
                minLength={6}
              />
            </div>
          </div>

          <Button
            type='submit'
            className='w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            disabled={loading}
          >
            {loading
              ? 'Loading...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </Button>
        </form>

        <div className='mt-6'>
          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <div className='w-full border-t border-gray-300' />
            </div>
            <div className='relative flex justify-center text-sm'>
              <span className='px-2 bg-white text-gray-500'>
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type='button'
            variant='outline'
            className='w-full mt-4'
            onClick={handleGoogleAuth}
            disabled={loading}
          >
            <svg className='w-5 h-5 mr-2' viewBox='0 0 24 24'>
              <path
                fill='#4285F4'
                d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              />
              <path
                fill='#34A853'
                d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              />
              <path
                fill='#FBBC05'
                d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
              />
              <path
                fill='#EA4335'
                d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
              />
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className='mt-6 text-center'>
          <button
            type='button'
            onClick={() =>
              onModeChange?.(mode === 'signin' ? 'signup' : 'signin')
            }
            className='text-sm text-blue-600 hover:text-blue-800'
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
