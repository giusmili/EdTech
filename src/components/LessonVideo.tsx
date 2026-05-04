'use client';

import { useEffect, useRef, useState } from 'react';

export default function LessonVideo({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Assign src only when the container enters the viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
    <div
      ref={containerRef}
      className="border border-black/5 relative overflow-hidden"
      style={{ width: '640px', maxWidth: '100%', borderRadius: '8px' }}
    >
      {isInView && (
        <video
          src={src}
          preload="metadata"
          controls
          playsInline
          onCanPlay={() => setIsReady(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            opacity: isReady ? 1 : 0,
            transition: 'opacity 0.4s ease',
          }}
        />
      )}

      {/* Skeleton shown before video is ready */}
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            background: 'transparent',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            style={{ opacity: 0.35 }}
          >
            <circle cx="20" cy="20" r="19" stroke="#121212" strokeWidth="1.5" />
            <polygon points="16,13 30,20 16,27" fill="#121212" />
          </svg>
          <p
            style={{
              fontSize: '9px',
              fontWeight: 700,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              opacity: 0.35,
            }}
          >
            Chargement…
          </p>
        </div>
      )}

      {/* Caption overlay */}
      {caption && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent"
          style={{ padding: '2rem 1.25rem 1rem', pointerEvents: 'none' }}
        >
          <p className="text-[10px] text-lgc-ink uppercase tracking-widest font-bold">{caption}</p>
        </div>
      )}
    </div>
    </div>
  );
}
