"use client";

import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { ACCEPTED_IMAGE_TYPES, isImageFile } from "@/lib/image-compress";
import { cn } from "@/lib/utils";
import { toast } from "@/store/toast";

type InsertImageButtonProps = {
  onPickFiles: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
  className?: string;
};

export function InsertImageButton({
  onPickFiles,
  disabled,
  className,
}: InsertImageButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList).filter(isImageFile);
    if (files.length === 0) {
      toast("Choose a JPEG, PNG, WebP, or GIF image", "error");
      return;
    }

    setBusy(true);
    try {
      await onPickFiles(files);
    } catch (err) {
      console.error(err);
      toast(
        err instanceof Error ? err.message : "Couldn’t upload image",
        "error"
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-xs text-muted-subtle",
          "transition-colors duration-fast ease-out hover:bg-hover hover:text-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:opacity-60",
          className
        )}
      >
        <ImagePlus className="size-3.5" strokeWidth={1.75} aria-hidden />
        {busy ? "Uploading…" : "Insert image"}
      </button>
    </>
  );
}
