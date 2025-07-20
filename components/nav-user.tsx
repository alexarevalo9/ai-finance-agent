'use client';

import { useState } from 'react';
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut, User, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import AuthModal from '@/components/auth/auth-modal';

export function NavUser({ isOpen }: { isOpen: boolean }) {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!user) {
    return (
      <>
        <SidebarMenu>
          <SidebarMenuItem
            className={`${!isOpen ? 'hover:bg-gray-100 rounded-md p-2' : ''}  hover:cursor-pointer`}
            onClick={() => setShowAuthModal(true)}
          >
            <div
              className={`flex gap-2 items-center ${!isOpen ? 'justify-center' : 'justify-between'} w-full`}
            >
              <div className='flex items-center gap-2 flex-1'>
                <Avatar className='h-8 w-8'>
                  <AvatarFallback className='bg-blue-100'>
                    <User className='h-4 w-4 text-blue-600' />
                  </AvatarFallback>
                </Avatar>
                {!isOpen && (
                  <div className='flex flex-col text-left flex-1'>
                    <span className='text-sm font-medium'>Sign In</span>
                    <span className='text-xs text-muted-foreground'>
                      Access your profile
                    </span>
                  </div>
                )}
              </div>
              {isOpen && <LogIn className='h-4 w-4 text-blue-600' />}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem
          className={`${!isOpen ? 'hover:bg-gray-100 rounded-md p-2' : ''}  hover:cursor-pointer`}
        >
          <div
            className={`flex gap-2 items-center ${!isOpen ? 'justify-center' : 'justify-between'} w-full`}
          >
            <div className='flex items-center gap-2 flex-1'>
              <Avatar className='h-8 w-8'>
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className='bg-green-100'>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isOpen && (
                <div className='flex flex-col text-left flex-1'>
                  <span className='text-sm font-medium truncate'>
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <span className='text-xs text-muted-foreground truncate'>
                    {user.email}
                  </span>
                </div>
              )}
            </div>
            {!isOpen && (
              <Button
                variant='ghost'
                size='icon'
                onClick={signOut}
                className='h-8 w-8 shrink-0 hover:cursor-pointer'
              >
                <LogOut className='h-4 w-4' />
              </Button>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}
