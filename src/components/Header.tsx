import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, Check, ArrowLeft, Layers } from 'lucide-react';
import { useLanguage, LANGUAGES, FLAG_SVGS, type Lang } from '../contexts/LanguageContext';

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
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '6px 10px', borderRadius: '8px',
          border: `1px solid ${open ? 'var(--card-border-hover)' : 'var(--card-border)'}`,
          background: open ? 'var(--card-hover)' : 'var(--card)',
          fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
          cursor: 'pointer', transition: 'all 0.15s',
          fontFamily: 'Instrument Sans, sans-serif',
        }}
        onMouseEnter={e => {
          (e.currentTarget).style.background = 'var(--card-hover)';
          (e.currentTarget).style.borderColor = 'var(--card-border-hover)';
          (e.currentTarget).style.color = 'var(--text)';
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget).style.background = 'var(--card)';
            (e.currentTarget).style.borderColor = 'var(--card-border)';
            (e.currentTarget).style.color = 'var(--text-2)';
          }
        }}
      >
        {FLAG_SVGS[lang]}
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>{current.code.toUpperCase()}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: 'flex' }}>
          <ChevronDown size={11} color="var(--text-3)" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: 'rgba(13,15,24,0.98)', backdropFilter: 'blur(24px)',
              border: '1px solid var(--card-border-hover)', borderRadius: '12px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.07)',
              minWidth: '160px', zIndex: 200, overflow: 'hidden', padding: '4px',
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
                    background: active ? 'var(--accent-dim)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget).style.background = 'var(--card-hover)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget).style.background = 'transparent'; }}
                >
                  {FLAG_SVGS[l.code as Lang]}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text)', fontFamily: 'Instrument Sans, sans-serif' }}>
                      {l.native}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {l.code.toUpperCase()}
                    </div>
                  </div>
                  {active && <Check size={12} color="var(--accent)" />}
                </button>
              );
            })}
            <div style={{
              margin: '4px 8px 2px', paddingTop: '8px',
              borderTop: '1px solid var(--card-border)',
              fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace',
              textAlign: 'center',
            }}>
              Translates descriptions
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDetailPage = location.pathname.startsWith('/mod/');
  const query = isDetailPage ? '' : (searchParams.get('q') ?? '');
  const [localQ, setLocalQ] = useState(query);

  useEffect(() => { if (!isDetailPage) setLocalQ(searchParams.get('q') ?? ''); }, [searchParams, isDetailPage]);

  const handleSearch = (q: string) => {
    setLocalQ(q);
    if (isDetailPage) {
      navigate(`/?q=${encodeURIComponent(q)}`);
    } else {
      setSearchParams(prev => {
        const n = new URLSearchParams(prev);
        if (q) n.set('q', q); else n.delete('q');
        n.delete('page');
        return n;
      }, { replace: true });
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); inputRef.current?.focus(); }
      if (e.key === 'Escape' && focused) { inputRef.current?.blur(); setFocused(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focused]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,8,13,0.82)',
        backdropFilter: 'blur(28px) saturate(160%)',
        WebkitBackdropFilter: 'blur(28px) saturate(160%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div style={{
        maxWidth: '1440px', margin: '0 auto',
        padding: '0 24px', height: '58px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        {/* Logo / Back */}
        {isDetailPage ? (
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-2)', fontSize: '13px', fontWeight: 500,
              padding: '6px 8px', borderRadius: '8px', transition: 'all 0.15s',
              flexShrink: 0, fontFamily: 'Instrument Sans, sans-serif',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.background = 'none'; }}
          >
            <ArrowLeft size={15} />
            Back
          </button>
        ) : (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '9px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px',
              background: 'linear-gradient(135deg, #1bca8e 0%, #0ea5e9 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(27,202,142,0.3)',
            }}>
              <Layers size={16} color="white" />
            </div>
            <span style={{
              fontFamily: 'Instrument Sans, sans-serif',
              fontSize: '17px', fontWeight: 700,
              color: 'var(--text)', letterSpacing: '-0.02em',
            }}>
              mod<span style={{ color: 'var(--accent)' }}>rift</span>
            </span>
          </Link>
        )}

        {/* Search */}
        <div style={{ flex: 1, maxWidth: '520px', position: 'relative' }}>
          <motion.div
            animate={{
              boxShadow: focused
                ? '0 0 0 2px rgba(27,202,142,0.2), 0 4px 20px rgba(0,0,0,0.3)'
                : '0 1px 4px rgba(0,0,0,0.3)',
            }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '0 13px', height: '38px',
              background: focused ? 'var(--input-focus)' : 'var(--input)',
              border: `1px solid ${focused ? 'rgba(27,202,142,0.4)' : 'var(--card-border)'}`,
              borderRadius: '10px', transition: 'border-color 0.18s, background 0.18s',
            }}
          >
            <Search size={14} color={focused ? 'var(--accent)' : 'var(--text-3)'} style={{ flexShrink: 0, transition: 'color 0.18s' }} />
            <input
              ref={inputRef}
              value={localQ}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search mods, modpacks, shaders…"
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: '13px', color: 'var(--text)',
                fontFamily: 'Instrument Sans, sans-serif',
              }}
            />
            {localQ && (
              <button
                onClick={() => handleSearch('')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: 'var(--card-hover)', border: 'none', cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={9} color="var(--text-3)" />
              </button>
            )}
            {!focused && !localQ && (
              <kbd style={{
                display: 'flex', alignItems: 'center', gap: '1px',
                padding: '2px 6px', background: 'var(--card)',
                border: '1px solid var(--card-border)', borderRadius: '5px',
                fontSize: '10px', color: 'var(--text-3)',
                fontFamily: 'JetBrains Mono, monospace', flexShrink: 0,
              }}>
                ⌘K
              </kbd>
            )}
          </motion.div>
        </div>

        {/* Right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LangSelector />
          <a
            href="https://modrinth.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '6px 12px', borderRadius: '8px',
              border: '1px solid var(--card-border)',
              fontSize: '12px', fontWeight: 500, color: 'var(--text-2)',
              textDecoration: 'none', transition: 'all 0.15s',
              background: 'var(--card)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--card)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-2)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)';
            }}
          >
            <img src="/modrinth.ico" width="14" height="14" alt="" style={{ display: 'block', flexShrink: 0 }} />
            Modrinth
          </a>
        </div>
      </div>
    </motion.header>
  );
}
