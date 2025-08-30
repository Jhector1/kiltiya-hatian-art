"use client";

import React from "react";
import "emoji-picker-element"; // registers <emoji-picker>

export default function EmojiPickerButtonWC({
  onPick,
}: {
  onPick: (emojiNative: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const pickerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = pickerRef.current as any;
    if (!el) return;
    const onClick = (e: any) => {
      const native = e?.detail?.unicode; // e.g. "😍"
      if (native) onPick(native);
      setOpen(false);
    };
    el.addEventListener("emoji-click", onClick);
    return () => el.removeEventListener("emoji-click", onClick);
  }, [onPick]);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="px-3 py-2 rounded bg-yellow-500 text-white shadow"
        onClick={() => setOpen(o => !o)}
      >
        😄 Emoji
      </button>
      {open && (
        <div className="absolute z-50 mt-2">
          {/* @ts-expect-error custom element */}
          <emoji-picker ref={pickerRef} style={{ width: 320, height: 420 }} />
        </div>
      )}
    </div>
  );
}
