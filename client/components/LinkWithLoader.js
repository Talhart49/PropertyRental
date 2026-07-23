"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

export default function LinkWithLoader({ href, children, className, variant = "default" }) {
  const [clicked, setClicked] = useState(false);

  const handleClick = useCallback(() => {
    setClicked(true);
  }, []);

  return (
    <>
      {clicked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-opacity duration-150">
          <div className="text-center">
            <div className="relative mx-auto h-10 w-10">
              <div className="absolute inset-0 rounded-full border-4 border-surface-200" />
              <div className="absolute inset-0 rounded-full border-4 border-t-brand-500 animate-spin" />
            </div>
            <p className="mt-4 text-sm text-surface-400">Loading...</p>
          </div>
        </div>
      )}
      <Link href={href} className={className} onClick={handleClick}>
        {children}
      </Link>
    </>
  );
}