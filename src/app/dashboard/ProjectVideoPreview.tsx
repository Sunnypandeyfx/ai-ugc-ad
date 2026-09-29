"use client";

import { useRef } from "react";

export default function ProjectVideoPreview({
  videoUrl,
  className = "aspect-video",
  iconSize = "h-9 w-9",
}: {
  videoUrl: string;
  className?: string;
  iconSize?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-black ${className}`}
      onMouseEnter={() => ref.current?.play().catch(() => {})}
      onMouseLeave={() => {
        const v = ref.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }}
    >
      <video
        ref={ref}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20 opacity-100 transition-opacity duration-200 group-hover:opacity-0">
        <span className={`flex items-center justify-center rounded-full bg-white/20 backdrop-blur ${iconSize}`}>
          <svg width="40%" height="40%" viewBox="0 0 24 24" fill="white" aria-hidden>
            <path d="M8 5v14l11-7L8 5Z" />
          </svg>
        </span>
      </div>
    </div>
  );
}
