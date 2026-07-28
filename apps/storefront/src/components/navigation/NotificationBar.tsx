"use client";

import { useState } from "react";

interface NotificationBarProps {
  message?: string;
  link?: string;
  onClose?: () => void;
}

export function NotificationBar({
  message = "Explore our handcrafted sustainable textiles & B2B partner solutions",
  link = "/wholesale-partner-program",
  onClose,
}: NotificationBarProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <div className="top_notification bg-[var(--fb-top-notification-bg,#fbf4e8)] text-black relative text-center cursor-pointer py-1 text-sm font-medium border-b border-[#efeee9] transition-all">
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:underline inline-block px-8"
      >
        <p className="m-0 text-xs sm:text-sm">{message}</p>
      </a>
      <button
        onClick={handleClose}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 text-gray-700 hover:text-black transition-colors"
        aria-label="Close notification"
      >
        <span className="material-symbols-outlined text-lg leading-none">close</span>
      </button>
    </div>
  );
}
