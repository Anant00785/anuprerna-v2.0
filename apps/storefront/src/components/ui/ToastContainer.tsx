"use client";

import React from "react";
import { useToastStore } from "@/stores/toast.store";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 p-4 bg-white rounded-lg shadow-xl border border-gray-100 animate-slide-in transition-all duration-300"
          style={{ borderLeft: toast.type === 'error' ? '4px solid #ef4444' : '4px solid #15a852' }}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              toast.type === "error" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <span className="material-symbols-outlined text-base">
              {toast.type === "error" ? "error" : "check"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 leading-snug">{toast.title}</h4>
            {toast.message && <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{toast.message}</p>}
          </div>

          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
            aria-label="Close notification"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      ))}
    </div>
  );
};
