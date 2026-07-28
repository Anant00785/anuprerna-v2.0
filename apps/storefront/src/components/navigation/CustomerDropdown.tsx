"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface CustomerDropdownProps {
  tenantName?: string;
  isLoggedIn?: boolean;
  activeWholesaleProgramOption?: boolean;
  hasActiveOrder?: boolean;
  onLogout?: () => void;
}

export function CustomerDropdown({
  tenantName = "Account",
  isLoggedIn = false,
  activeWholesaleProgramOption = false,
  hasActiveOrder = false,
  onLogout,
}: CustomerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth"
        className="fb-arrow-btn flex items-center justify-center text-sm font-semibold hover:text-[#9c8a6c] transition-colors py-1 px-2"
      >
        <span className="mr-1">Sign In</span>
        <svg className="HoverArrow w-2.5 h-2.5" viewBox="0 0 10 10" aria-hidden="true">
          <g fillRule="evenodd">
            <path className="HoverArrow__linePath" d="M0 5h7" />
            <path className="HoverArrow__tipPath" d="M1 1l4 4-4 4" />
          </g>
        </svg>
      </Link>
    );
  }

  return (
    <div
      ref={containerRef}
      className="select_trigger_cont relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="sf-indicator transition flex items-center justify-center gap-1.5 py-1 px-2 text-sm font-medium hover:text-[#9c8a6c]"
        type="button"
      >
        {activeWholesaleProgramOption ? (
          <span className="material-symbols-outlined text-[#B79C8F] text-xl leading-none">crown</span>
        ) : (
          <span className="material-symbols-outlined text-lg leading-none">person</span>
        )}
        <span className="text-xs font-semibold mr-1">{tenantName}</span>
        {hasActiveOrder && (
          <span className="status-dot status-red w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
        )}
        <span className="material-symbols-outlined text-base leading-none">
          {isOpen ? "arrow_drop_up" : "arrow_drop_down"}
        </span>
      </button>

      {isOpen && (
        <div className="select absolute right-0 top-full mt-1 bg-white border border-[#EFEEE9] rounded-md shadow-xl z-50 min-w-[180px] py-1 text-left text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="option block px-4 py-2 hover:bg-[#f7f6f2] hover:text-[#9c8a6c] font-medium text-gray-700 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/profile/order"
            onClick={() => setIsOpen(false)}
            className="option flex items-center justify-between px-4 py-2 hover:bg-[#f7f6f2] hover:text-[#9c8a6c] font-medium text-gray-700 transition-colors"
          >
            <span>{hasActiveOrder ? "Active Order" : "Orders"}</span>
            {hasActiveOrder && <span className="w-2 h-2 rounded-full bg-red-500" />}
          </Link>
          <Link
            href="/profile/address"
            onClick={() => setIsOpen(false)}
            className="option block px-4 py-2 hover:bg-[#f7f6f2] hover:text-[#9c8a6c] font-medium text-gray-700 transition-colors"
          >
            Address
          </Link>
          <Link
            href="/profile/account"
            onClick={() => setIsOpen(false)}
            className="option block px-4 py-2 hover:bg-[#f7f6f2] hover:text-[#9c8a6c] font-medium text-gray-700 transition-colors"
          >
            Account
          </Link>
          <Link
            href="/profile/wholesale-program"
            onClick={() => setIsOpen(false)}
            className="option block px-4 py-2 hover:bg-[#f7f6f2] hover:text-[#9c8a6c] font-medium text-gray-700 transition-colors"
          >
            Wholesale Program
          </Link>
          <Link
            href="/contact"
            onClick={() => setIsOpen(false)}
            className="option block px-4 py-2 hover:bg-[#f7f6f2] hover:text-[#9c8a6c] font-medium text-gray-700 transition-colors border-b border-[#efeee9]"
          >
            Contact Us
          </Link>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              if (onLogout) onLogout();
            }}
            className="option w-full text-left flex items-center justify-between px-4 py-2 hover:bg-[#f7f6f2] text-red-600 font-semibold transition-colors"
          >
            <span>Logout</span>
            <span className="material-symbols-outlined text-base">logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
