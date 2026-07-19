"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppNav } from "@/hooks/use-app-nav";
import { HOME_PATH } from "@/lib/navigation";

/**
 * Legacy /search route — redirects home and focuses the persistent search bar.
 */
export default function SearchRoutePage() {
  const router = useRouter();
  const { openSearch } = useAppNav();

  useEffect(() => {
    router.replace(HOME_PATH);
    const id = window.setTimeout(() => openSearch(), 50);
    return () => window.clearTimeout(id);
  }, [router, openSearch]);

  return null;
}
