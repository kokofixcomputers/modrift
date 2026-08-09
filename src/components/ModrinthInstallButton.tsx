import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Download, X } from 'lucide-react';

function AppNotFoundModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(13,15,24,0.98)', backdropFilter: 'blur(24px)',
          borderRadius: '18px', maxWidth: '400px', width: '100%',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        {/* Accent strip */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, #1bca8e, #0ea5e9)' }} />

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '11px', flexShrink: 0,
                background: 'rgba(27,202,142,0.12)', border: '1px solid rgba(27,202,142,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Download size={18} color="#1bca8e" />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: '15px', fontWeight: 700, color: 'rgba(228,231,242,0.94)', margin: 0 }}>
                  Modrinth App not found
                </h3>
                <p style={{ fontSize: '11px', color: 'rgba(228,231,242,0.3)', fontFamily: 'JetBrains Mono, monospace', margin: '3px 0 0' }}>
                  Required for one-click install
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <X size={12} color="rgba(228,231,242,0.3)" />
            </button>
          </div>

          <p style={{ fontSize: '13px', color: 'rgba(228,231,242,0.52)', lineHeight: 1.65, margin: '0 0 20px' }}>
            The <strong style={{ color: 'rgba(228,231,242,0.85)' }}>Modrinth App</strong> wasn't detected.
            Install it to get one-click mod installs, automatic updates, and a built-in launcher.
          </p>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href="https://modrinth.com/app" target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', background: 'linear-gradient(135deg, #1bca8e, #0ea5e9)',
                color: 'white', borderRadius: '10px', textDecoration: 'none',
                fontSize: '12px', fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
                boxShadow: '0 2px 12px rgba(27,202,142,0.3)',
                transition: 'filter 0.14s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ''}
            >
              <Download size={12} /> Download Modrinth App
            </a>
            <button
              onClick={onClose}
              style={{
                padding: '10px 16px', background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
                cursor: 'pointer', fontSize: '12px', color: 'rgba(228,231,242,0.52)',
                fontFamily: 'Instrument Sans, sans-serif', transition: 'all 0.14s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = 'rgba(228,231,242,0.85)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = 'rgba(228,231,242,0.52)'; }}
            >
              Cancel
            </button>
          </div>

          <p style={{ marginTop: '14px', fontSize: '10px', color: 'rgba(228,231,242,0.25)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
            Already installed?{' '}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1bca8e', fontSize: '10px', fontFamily: 'JetBrains Mono, monospace', padding: 0 }}>
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
  const timer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const markOpened = () => { if (!trying.current || opened.current) return; opened.current = true; if (timer.current) clearTimeout(timer.current); };
    const onBlur       = () => markOpened();
    const onVisibility = () => { if (document.visibilityState === 'hidden') markOpened(); };
    const onFocus      = () => { if (!trying.current) opened.current = false; };

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
      <button onClick={handleClick} style={style} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
        <Rocket size={12} />
        {label}
      </button>
      <AnimatePresence>
        {showPrompt && <AppNotFoundModal onClose={() => setShowPrompt(false)} />}
      </AnimatePresence>
    </>
  );
}
