"use client";

import { useEffect, useId } from "react";
import { cn } from "@/lib/utils";

type ImageLightboxProps = {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
};

export function ImageLightbox({
  src,
  alt = "",
  open,
  onClose,
}: ImageLightboxProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/70 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[min(92vh,900px)] max-w-[min(96vw,1100px)]"
      >
        <h2 id={titleId} className="sr-only">
          {alt.trim() || "Image preview"}
        </h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[min(92vh,900px)] max-w-full rounded-md object-contain shadow-lg"
        />
        <button
          type="button"
          onClick={onClose}
          className={cn(
            "absolute -right-1 -top-10 rounded-md px-2 py-1 text-xs text-white/90",
            "transition-colors duration-fast ease-out hover:bg-white/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:-right-2"
          )}
        >
          Close
        </button>
      </div>
    </div>
  );
}
