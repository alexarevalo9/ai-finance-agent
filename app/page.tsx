'use client';

import Chat from '@/components/chat';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Home() {
  const isMobile = useIsMobile();
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 h-full'>
      {isMobile && (
        <div className='fixed left-0 top-0 m-1 z-50'>
          <SidebarTrigger className='rounded-full bg-gray-200 p-4' />
        </div>
      )}
      <Chat />
      {/* <div className='grid grid-cols-2 gap-4 flex-1'>
        <div className='bg-muted rounded-xl' />
        <div className='bg-muted rounded-xl' />
      </div> */}
    </div>
  );
}
