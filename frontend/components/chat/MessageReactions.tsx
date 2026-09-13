"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker, { SkinTones, Theme } from "emoji-picker-react";
import { MessageReaction } from "@/lib/api-client";

interface MessageReactionsProps {
  messageId: string;
  reactions: MessageReaction[];
  viewerId?: string | null;
  onToggleReaction: (messageId: string, emoji: string) => Promise<boolean>;
  addReactionLabel: string;
}

export default function MessageReactions({
  messageId,
  reactions,
  viewerId,
  onToggleReaction,
  addReactionLabel,
}: MessageReactionsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const groupedReactions = useMemo(() => {
    return reactions.reduce<Record<string, number>>((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = 0;
      }

      acc[reaction.emoji] += 1;
      return acc;
    }, {});
  }, [reactions]);

  const hasViewerReaction = useMemo(() => {
    if (!viewerId) return false;
    const normalizedViewerId = viewerId.toLowerCase();
    return reactions.some((reaction) => reaction.user_id.toLowerCase() === normalizedViewerId);
  }, [reactions, viewerId]);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5" ref={rootRef}>
      {Object.entries(groupedReactions).map(([emoji, count]) => (
        <button
          key={`${messageId}-${emoji}`}
          type="button"
          onClick={() => onToggleReaction(messageId, emoji)}
          className="px-2 py-0.5 rounded-full text-xs border transition-colors bg-[#4fdfff]/15 border-[#4fdfff]/50 text-[#4fdfff] hover:bg-[#4fdfff]/20"
        >
          <span className="mr-1">{emoji}</span>
          <span>{count}</span>
        </button>
      ))}

      {!hasViewerReaction && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="text-sm text-white/50 hover:text-[#4fdfff] transition-colors opacity-0 group-hover:opacity-100"
            title={addReactionLabel}
            aria-label={addReactionLabel}
          >
            +
          </button>

          {open && (
            <div className="absolute z-50 mt-2 left-0 border border-[#4fdfff]/30 rounded-lg overflow-hidden shadow-xl bg-[rgba(10,15,20,0.98)]">
              <EmojiPicker
                className="message-reactions-emoji-picker"
                width={320}
                height={380}
                lazyLoadEmojis={true}
                defaultSkinTone={SkinTones.NEUTRAL}
                skinTonesDisabled={true}
                previewConfig={{ showPreview: false }}
                theme={Theme.DARK}
                onEmojiClick={(emojiData) => {
                  onToggleReaction(messageId, emojiData.emoji);
                  setOpen(false);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
