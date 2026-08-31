'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
}

interface ProfileShellProps {
  children: React.ReactNode;
  userName?: string;
  showWholesale?: boolean;
}

export default function ProfileShell({ children, userName, showWholesale }: ProfileShellProps) {
  const pathname = usePathname();

  // Live profile-sidebar item set (text-only, no icons, no Wishlist, no Sign Out).
  const navItems: NavItem[] = [
    { href: '/profile/dashboard', label: 'Dashboard' },
    { href: '/profile/order', label: 'Orders' },
    { href: '/profile/address', label: 'Addresses' },
    { href: '/profile/account', label: 'Account' },
    { href: '/profile/notification-settings', label: 'Notification Settings' },
    ...(showWholesale ? [{ href: '/profile/wholesale-program', label: 'Wholesale Program' }] : []),
  ];

  const isActive = (href: string) => {
    if (href === '/profile/dashboard') return pathname === '/profile/dashboard' || pathname === '/profile';
    return pathname.startsWith(href);
  };

  return (
    <main className="min-h-[70vh] bg-sand/30">
      <div className="mx-auto max-w-screen-xl px-4 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar -- desktop column / mobile horizontally-scrollable tab bar (matches live) */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="lg:sticky lg:top-[100px]">
              {/* name greeting block (no avatar) */}
              {userName && (
                <div className="hidden lg:block rounded-md shadow bg-cream px-5 py-2.5 mt-2.5">
                  <span className="text-[18px] font-semibold text-[#010101]">{userName}</span>
                </div>
              )}
              {/*
                Mobile: a horizontal tab bar. With 6 panes the old fixed basis-1/4 row
                overflowed the content card (Notification Settings + Wholesale Program
                spilled off-screen at 390px). Make it a single scrollable row that never
                clips: overflow-x-auto + whitespace-nowrap, items sized to content. Desktop
                stays a stacked column.
              */}
              <nav
                aria-label="Profile sections"
                className="flex flex-row lg:flex-col w-full overflow-x-auto lg:overflow-visible whitespace-nowrap lg:whitespace-normal -mx-1 px-1 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {navItems.map(item => (
                  <div
                    key={item.href}
                    className="flex-shrink-0 lg:flex-shrink lg:basis-auto transition-all duration-500 hover:bg-[#d6cab7] hover:rounded-md"
                  >
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={
                        'block px-5 py-2.5 text-[13px] lg:text-[16px] text-center lg:text-left ' +
                        (isActive(item.href)
                          ? 'border-[2px] border-[#D2BACA] rounded-md'
                          : '')
                      }
                    >
                      {item.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </main>
  );
}
