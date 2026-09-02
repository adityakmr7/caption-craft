"use client";

import { useState } from "react";
import { Globe, MessageCircle, MoreHorizontal, Repeat2, Send, ThumbsUp, User } from "lucide-react";

// Mirrors LinkedIn's actual feed-post chrome (avatar, name/headline row,
// hashtags in-brand-blue, "...more" truncation, the 4-icon action bar) so
// what the user sees here is what the post will actually look like once
// pasted onto LinkedIn — not just a plain text preview. Deliberately
// light-themed regardless of CaptionCraft's own dark UI, since it's
// simulating the other product, not this one. Name/photo are placeholders
// (CaptionCraft doesn't have your real LinkedIn identity) — everything
// else renders your actual generated text.

const COLLAPSED_CHARS = 210; // roughly LinkedIn's real "see more" fold

export default function LinkedInPreview({
  text,
  hashtags,
}: {
  text: string;
  hashtags: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > COLLAPSED_CHARS;

  return (
    <div className="rounded-lg border border-black/10 bg-white shadow-sm overflow-hidden">
      <div className="flex items-start gap-2 px-4 pt-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d99a3e]/90 text-white">
          <User className="h-6 w-6" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight text-black/90">Your Name</p>
          <p className="truncate text-xs leading-tight text-black/60">Founder</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-black/60">
            Now
            <span aria-hidden>·</span>
            <Globe className="h-3 w-3" strokeWidth={2} />
          </p>
        </div>
        <MoreHorizontal className="h-5 w-5 shrink-0 text-black/50" strokeWidth={2} />
      </div>

      <div className="px-4 pt-2 pb-3 text-[14px] leading-[1.45] text-black/90">
        <p className={`whitespace-pre-line ${!expanded && needsTruncation ? "line-clamp-3" : ""}`}>
          {text}
        </p>
        {needsTruncation && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-0.5 font-semibold text-black/60 hover:text-black/80"
          >
            {expanded ? "see less" : "...see more"}
          </button>
        )}
        {hashtags.length > 0 && (
          <p className="mt-2 flex flex-wrap gap-x-1.5 text-[#0a66c2]">
            {hashtags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-black/10 px-2 py-1">
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageCircle, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            title={label}
            className="flex flex-1 items-center justify-center rounded px-1 py-2 text-black/60"
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
            <span className="sr-only">{label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
