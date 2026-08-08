import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Download, X, ExternalLink } from 'lucide-react';

function AppNotFoundModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
        zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 8px 24px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.9)',
          maxWidth: '420px', width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div style={{ height: '4px', background: 'linear-gradient(90deg, #1bca8e, #0ea5e9)' }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(27,202,142,0.15), rgba(14,165,233,0.15))',
                border: '1px solid rgba(27,202,142,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Download size={20} color="#1bca8e" />
              </div>
              <div>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 800,
                  color: 'var(--text-primary)', margin: 0,
                }}>
                  Modrinth App not found
                </h3>
                <p style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace', margin: '3px 0 0',
                }}>
                  Required for one-click install
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--surface)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={13} color="var(--text-secondary)" />
            </button>
          </div>

          {/* Body */}
          <p style={{
            fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65,
            margin: '0 0 24px',
          }}>
            The <strong style={{ color: 'var(--text-primary)' }}>Modrinth App</strong> wasn't detected on your system.
            Install it to get one-click mod installs, automatic updates, and a built-in launcher.
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <a
              href="https://modrinth.com/app"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '11px',
                background: 'linear-gradient(135deg, #1bca8e, #0ea5e9)',
                color: 'white', borderRadius: '12px', textDecoration: 'none',
                fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
                boxShadow: '0 2px 12px rgba(27,202,142,0.3)',
                transition: 'filter 0.15s, transform 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.filter = '';
                (e.currentTarget as HTMLElement).style.transform = '';
              }}
            >
              <Download size={13} />
              Download Modrinth App
            </a>
            <button
              onClick={onClose}
              style={{
                padding: '11px 18px',
                background: 'var(--off-white)', border: '1px solid var(--border)',
                borderRadius: '12px', cursor: 'pointer',
                fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'DM Sans, sans-serif',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--off-white)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }}
            >
              Cancel
            </button>
          </div>

          {/* Already have it hint */}
          <p style={{
            marginTop: '16px', fontSize: '11px', color: 'var(--text-muted)',
            textAlign: 'center', fontFamily: 'DM Mono, monospace',
          }}>
            Already installed?{' '}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1bca8e', fontSize: '11px', fontFamily: 'DM Mono, monospace', padding: 0 }}
            >
              Try again
            </button>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface ModrinthInstallButtonProps {
  href: string;
  label?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function ModrinthInstallButton({
  href,
  label = 'Install with Modrinth',
  style,
  onMouseEnter,
  onMouseLeave,
}: ModrinthInstallButtonProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const trying = useRef(false);
  const opened = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const markOpened = () => {
      if (!trying.current || opened.current) return;
      opened.current = true;
      if (timer.current) clearTimeout(timer.current);
    };

    const onBlur = () => markOpened();
    const onVisibility = () => { if (document.visibilityState === 'hidden') markOpened(); };
    const onFocus = () => { if (!trying.current) opened.current = false; };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const handleClick = () => {
    trying.current = true;
    opened.current = false;

    window.location.href = href;

    timer.current = setTimeout(() => {
      if (!opened.current) setShowPrompt(true);
      trying.current = false;
    }, 1500);
  };

  return (
    <>
      <button
        onClick={handleClick}
        style={style}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <Rocket size={13} />
        {label}
      </button>

      <AnimatePresence>
        {showPrompt && <AppNotFoundModal onClose={() => setShowPrompt(false)} />}
      </AnimatePresence>
    </>
  );
}
