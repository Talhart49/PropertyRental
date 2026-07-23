"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const toastStyles = {
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-800",
  error:
    "border-red-200 bg-red-50 text-red-700",
  info:
    "border-blue-200 bg-blue-50 text-blue-800",
  warning:
    "border-amber-200 bg-amber-50 text-amber-800"
};

const toastIcons = {
  success: "\u2713",
  error: "\u2717",
  info: "\u2139",
  warning: "\u26A0"
};

function ToastItem({ id, message, type, onDismiss }) {
  const timerRef = useRef(null);
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 200);
  }, [id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, 5000);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [dismiss]);

  return (
    <div
      className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm shadow-lg shadow-stone-200/70 transition-all duration-200 ${
        isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
      } ${toastStyles[type] || toastStyles.info}`}
      role="alert"
    >
      <span className="mt-0.5 text-base font-bold">{toastIcons[type] || toastIcons.info}</span>
      <p className="flex-1 leading-6">{message}</p>
      <button
        className="ml-2 text-base font-bold leading-none hover:opacity-70"
        onClick={dismiss}
        type="button"
      >
        &times;
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex max-w-sm flex-col gap-3"
    >
      {toasts.map((toast) => (
        <ToastItem
          id={toast.id}
          key={toast.id}
          message={toast.message}
          onDismiss={onDismiss}
          type={toast.type}
        />
      ))}
    </div>
  );
}