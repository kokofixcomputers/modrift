import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Layers, Zap, ChevronDown, Check } from 'lucide-react';
import { useLanguage, LANGUAGES, type Lang } from '../contexts/LanguageContext';

interface HeaderProps {
  query: string;
  onQueryChange: (q: string) => void;
}

function LangSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find(l => l.code === lang)!;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 10px',
          borderRadius: '10px',
          border: `1px solid ${open ? 'var(--border-strong)' : 'var(--border)'}`,
          background: open ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
          fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
          cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'DM Sans, sans-serif',
        }}
        onMouseEnter={e => {
          (e.currentTarget).style.background = 'rgba(255,255,255,0.95)';
          (e.currentTarget).style.borderColor = 'var(--border-strong)';
          (e.currentTarget).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget).style.background = 'rgba(255,255,255,0.6)';
            (e.currentTarget).style.borderColor = 'var(--border)';
            (e.currentTarget).style.color = 'var(--text-secondary)';
          }
        }}
      >
        <span style={{ fontSize: '16px', lineHeight: 1 }}>{current.flag}</span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '12px' }}>{current.code.toUpperCase()}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.18 }}
          style={{ display: 'flex' }}
        >
          <ChevronDown size={12} color="var(--text-muted)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              minWidth: '160px', zIndex: 200, overflow: 'hidden',
              padding: '4px',
            }}
          >
            {LANGUAGES.map(l => {
              const active = l.code === lang;
              return (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as Lang); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 10px', borderRadius: '8px', border: 'none',
                    background: active ? 'var(--accent-light)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget).style.background = 'var(--off-white)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget).style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>{l.flag}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif' }}>
                      {l.native}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                      {l.code.toUpperCase()}
                    </div>
                  </div>
                  {active && <Check size={13} color="var(--accent)" />}
                </button>
              );
            })}
            <div style={{
              margin: '4px 8px 2px', paddingTop: '8px',
              borderTop: '1px solid var(--border)',
              fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace',
              textAlign: 'center',
            }}>
              Translates mod descriptions
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header({ query, onQueryChange }: HeaderProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && focused) {
        inputRef.current?.blur();
        setFocused(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(249, 250, 251, 0.88)',
        backdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(203, 213, 225, 0.4)',
        boxShadow: '0 1px 24px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        maxWidth: '1400px', margin: '0 auto',
        padding: '0 24px', height: '64px',
        display: 'flex', alignItems: 'center', gap: '20px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #1bca8e, #0ea5e9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(27,202,142,0.35)',
          }}>
            <Layers size={17} color="white" />
          </div>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
          }}>
            mod<span style={{ color: 'var(--accent)' }}>rift</span>
          </span>
        </div>

        {/* Search bar */}
        <div style={{ flex: 1, maxWidth: '600px', position: 'relative' }}>
          <motion.div
            animate={{
              boxShadow: focused
                ? '0 0 0 3px rgba(27,202,142,0.15), 0 4px 20px rgba(0,0,0,0.08)'
                : '0 1px 6px rgba(0,0,0,0.05)',
            }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '0 14px', height: '40px',
              background: 'rgba(255,255,255,0.9)',
              border: `1px solid ${focused ? 'rgba(27,202,142,0.5)' : 'var(--border)'}`,
              borderRadius: '12px', transition: 'border-color 0.2s ease',
            }}
          >
            <Search size={15} color={focused ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search mods, modpacks, shaders..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: '14px', color: 'var(--text-primary)',
                fontFamily: 'DM Sans, sans-serif',
              }}
            />
            {query && (
              <button
                onClick={() => onQueryChange('')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: 'var(--border)', border: 'none', cursor: 'pointer',
                  flexShrink: 0, transition: 'background 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-strong)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--border)')}
              >
                <X size={10} color="var(--text-secondary)" />
              </button>
            )}
            {!focused && !query && (
              <kbd style={{
                display: 'flex', alignItems: 'center', gap: '2px',
                padding: '2px 6px', background: 'var(--off-white)',
                border: '1px solid var(--border)', borderRadius: '5px',
                fontSize: '11px', color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace', flexShrink: 0,
              }}>
                ⌘K
              </kbd>
            )}
          </motion.div>
        </div>

        {/* Right side */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LangSelector />
          <a
            href="https://modrinth.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 12px', borderRadius: '10px',
              border: '1px solid var(--border)',
              fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)',
              textDecoration: 'none', transition: 'all 0.15s',
              background: 'rgba(255,255,255,0.6)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.95)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.6)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
            }}
          >
            <Zap size={13} />
            Modrinth
          </a>
        </div>
      </div>
    </motion.header>
  );
}
