"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type MobilePageTransitionProps = {
  children: ReactNode;
  className?: string;
  /** Extra key segment for same-path pane switches (e.g. mobile All Notes). */
  forceKey?: string;
};

/**
 * Subtle slide transition on mobile route changes without remounting children
 * (avoids skeleton/sort flicker). Animation class is applied briefly on change.
 */
export function MobilePageTransition({
  children,
  className,
  forceKey,
}: MobilePageTransitionProps) {
  const pathname = usePathname();
  const routeKey = forceKey ? `${pathname}:${forceKey}` : pathname;
  const prevKeyRef = useRef(routeKey);
  const depthRef = useRef(routeDepth(pathname));
  const [animClass, setAnimClass] = useState<string | null>(null);

  useEffect(() => {
    if (routeKey === prevKeyRef.current) return;
    const nextDepth = forceKey ? 2 : routeDepth(pathname);
    const prevDepth = depthRef.current;
    const forward = nextDepth >= prevDepth;
    depthRef.current = nextDepth;
    prevKeyRef.current = routeKey;
    setAnimClass(forward ? "animate-mobile-push" : "animate-mobile-pop");

    const timer = window.setTimeout(() => setAnimClass(null), 220);
    return () => window.clearTimeout(timer);
  }, [routeKey, pathname, forceKey]);

  return (
    <div
      className={cn(
        "h-full w-full md:animate-none",
        animClass,
        className
      )}
    >
      {children}
    </div>
  );
}

function routeDepth(pathname: string): number {
  if (pathname.startsWith("/note/")) return 3;
  if (pathname.startsWith("/folder/")) return 2;
  if (pathname.startsWith("/search")) return 2;
  return 1;
}
