import { useState } from 'react';
import { Play, ShieldOff } from 'lucide-react';

// Matches YouTube and youtube-nocookie embed iframes, capturing the video ID.
// Must be called on the RAW html before sanitization so the iframe tags are still present.
const YT_IFRAME_RE = /<iframe[^>]+src=["']https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com)\/embed\/([A-Za-z0-9_-]+)([^"']*)["'][^>]*(?:>\s*<\/iframe>|\/?>)/gi;

export type DescPart = { type: 'html'; content: string } | { type: 'youtube'; videoId: string };

export function parseYouTubeParts(html: string): DescPart[] {
  const parts: DescPart[] = [];
  let last = 0;
  YT_IFRAME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = YT_IFRAME_RE.exec(html)) !== null) {
    if (m.index > last) parts.push({ type: 'html', content: html.slice(last, m.index) });
    parts.push({ type: 'youtube', videoId: m[1] });
    last = m.index + m[0].length;
  }
  if (last < html.length) parts.push({ type: 'html', content: html.slice(last) });
  return parts.length ? parts : [{ type: 'html', content: html }];
}

export function YouTubeEmbed({ videoId }: { videoId: string }) {
  const [accepted, setAccepted] = useState(false);
  const thumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  if (accepted) {
    return (
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, margin: '18px 0', borderRadius: '12px', overflow: 'hidden' }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="YouTube video"
        />
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', margin: '18px 0', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
      {/* 16:9 aspect box */}
      <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
        <img
          src={thumb}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
        />
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: '14px', padding: '24px',
        }}>
          {/* Play circle */}
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Play size={22} color="white" fill="white" />
          </div>

          {/* Warning */}
          <div style={{
            maxWidth: '420px', textAlign: 'center',
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '10px', padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
              <ShieldOff size={13} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                External Content
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontFamily: 'Instrument Sans, sans-serif', lineHeight: 1.55, margin: 0 }}>
              This video is hosted on YouTube. Once loaded, YouTube may collect data about your visit. We use <strong style={{ color: 'rgba(255,255,255,0.9)' }}>youtube-nocookie.com</strong> to reduce tracking, but cannot guarantee complete privacy as this is outside our control.
            </p>
          </div>

          <button
            onClick={() => setAccepted(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '7px',
              padding: '9px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.95)', color: '#111',
              fontSize: '13px', fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
              transition: 'background 0.14s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'white'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.95)'; }}
          >
            <Play size={13} fill="#111" />
            Play video
          </button>
        </div>
      </div>
    </div>
  );
}
