"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { ImageLightbox } from "@/components/editor/ImageLightbox";
import { cn } from "@/lib/utils";

export function NoteImageView({ node, selected }: NodeViewProps) {
  const src = (node.attrs.src as string) || "";
  const alt = (node.attrs.alt as string) || "";
  const uploading = Boolean(node.attrs.uploading);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  const openLightbox = useCallback(() => {
    if (uploading || !src || broken) return;
    setLightboxOpen(true);
  }, [uploading, src, broken]);

  return (
    <NodeViewWrapper
      as="div"
      className={cn(
        "note-image-wrap",
        selected && "note-image-wrap--selected",
        uploading && "note-image-wrap--uploading"
      )}
      data-drag-handle=""
    >
      <div className="note-image-frame">
        {src && !broken ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            className="note-image"
            draggable={false}
            onClick={openLightbox}
            onError={() => setBroken(true)}
          />
        ) : (
          <div className="note-image-fallback">
            {uploading ? "Uploading image…" : "Image unavailable"}
          </div>
        )}

        {uploading ? (
          <div className="note-image-overlay" aria-live="polite">
            <Loader2
              className="size-5 animate-spin text-white"
              strokeWidth={1.75}
              aria-hidden
            />
            <span className="text-xs text-white/95">Uploading…</span>
          </div>
        ) : null}
      </div>

      <ImageLightbox
        src={src}
        alt={alt}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </NodeViewWrapper>
  );
}
