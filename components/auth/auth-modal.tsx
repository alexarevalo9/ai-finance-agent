'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AuthForm from './auth-form';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(defaultMode);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Backdrop */}
      <div
        className='absolute inset-0 bg-black/50 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className='relative z-10 w-full max-w-md mx-4'>
        <div className='relative bg-white rounded-xl shadow-2xl'>
          {/* Close Button */}
          <button
            onClick={onClose}
            className='absolute right-4 top-4 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors'
          >
            <X className='w-5 h-5 text-gray-500' />
          </button>

          {/* Auth Form */}
          <AuthForm mode={authMode} onModeChange={setAuthMode} />
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
