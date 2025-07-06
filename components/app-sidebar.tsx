'use client';

import * as React from 'react';
import { BookOpen, Bot, Settings2, SquareTerminal } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavProjects } from '@/components/nav-projects';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { SignedIn } from '@clerk/nextjs';
import { useIsMobile } from '@/hooks/use-mobile';

const data = {
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminal,
      isActive: true,
    },
    {
      title: 'Models',
      url: '#',
      icon: Bot,
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpen,
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2,
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
    },
    {
      name: 'Sales & Marketing',
      url: '#',
    },
    {
      name: 'Travel',
      url: '#',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const isMobile = useIsMobile();

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <div
          className={`group/header flex ${isOpen ? 'justify-center' : 'justify-between'}`}
        >
          <span
            className={`text-center font-bold w-7 h-7  ${isOpen ? 'group-hover/header:hidden' : ''}`}
          >
            AI
          </span>
          <div
            className={`${isOpen ? 'w-7 h-7 hidden group-hover/header:inline-block' : ''}`}
          >
            {!isMobile && <SidebarTrigger onClick={() => setIsOpen(!isOpen)} />}
          </div>
        </div>
      </SidebarHeader>
      <SignedIn>
        <SidebarContent>
          <NavMain items={data.navMain} />
          <NavProjects projects={data.projects} />
        </SidebarContent>
      </SignedIn>
      <SidebarFooter className='mt-auto'>
        <NavUser isOpen={isOpen} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
