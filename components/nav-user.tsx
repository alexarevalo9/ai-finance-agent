'use client';

import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function NavUser({ isOpen }: { isOpen: boolean }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem
        className={`${!isOpen ? 'hover:bg-gray-100 rounded-md' : ''} p-2 hover:cursor-pointer`}
      >
        <SignedIn>
          <UserButton
            showName={!isOpen}
            appearance={{
              elements: {
                rootBox: '!w-full',
                userButtonTrigger: '!w-full',
                userButtonBox: '!w-full !justify-between',
                userButtonOuterIdentifier: '!p-0',
              },
            }}
          />
        </SignedIn>
        <SignedOut>
          <SignInButton mode='modal'>
            <div
              className={`flex gap-2 items-center ${!isOpen ? 'justify-between' : 'justify-center'}`}
            >
              {!isOpen && (
                <span className='text-[13px] font-medium'>My Profile</span>
              )}
              <Avatar>
                <AvatarImage src='https://github.com/shadcn.png' />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            </div>
          </SignInButton>
        </SignedOut>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
