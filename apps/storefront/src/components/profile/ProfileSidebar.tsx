'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ProfileSidebarProps {
  userName?: string;
  showWholesaleProgram?: boolean;
}

export const ProfileSidebar: React.FC<ProfileSidebarProps> = ({
  userName = 'Ananya Sharma',
  showWholesaleProgram = true,
}) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/profile/dashboard' },
    { name: 'Orders', href: '/profile/order' },
    { name: 'Addresses', href: '/profile/address' },
    { name: 'Account', href: '/profile/account' },
    { name: 'Notification Settings', href: '/profile/notification-settings' },
  ];

  if (showWholesaleProgram) {
    navItems.push({ name: 'Wholesale Program', href: '/profile/wholesale-program' });
  }

  const isLinkActive = (href: string) => {
    if (href === '/profile/dashboard') {
      return pathname === '/profile' || pathname === '/profile/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full lg:sticky lg:top-[100px]">
      {/* Desktop User Name Header */}
      {userName && (
        <div className="hidden lg:block px-5 py-2.5 bg-[#FFFCF7] text-gray-900 rounded-md shadow mb-4">
          <span className="font-semibold text-lg">{userName}</span>
        </div>
      )}

      {/* Navigation Menu Links */}
      <div className="flex flex-wrap lg:flex-col w-full gap-1 lg:gap-1.5">
        {navItems.map((item) => {
          const active = isLinkActive(item.href);
          return (
            <div
              key={item.href}
              className="w-1/3 sm:w-1/4 lg:w-full transition-all duration-300 rounded-md hover:bg-[#d6cab7]/50"
            >
              <Link
                href={item.href}
                className={`block text-center lg:text-left px-2 py-2.5 lg:px-5 lg:py-2.5 text-xs sm:text-sm lg:text-base text-gray-800 font-medium transition-all ${
                  active ? 'border-2 border-[#D2BACA] rounded-md font-semibold bg-white/60' : ''
                }`}
              >
                {item.name}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};
