import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps {
  options: Option[];
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  placeholder: string;
  multiple?: boolean;
  searchable?: boolean;
  label?: string;
}

export function Dropdown({ options, value, onChange, placeholder, multiple = false, searchable = true, label }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = multiple
    ? (Array.isArray(value) ? value : [])
    : (typeof value === 'string' ? value : '');

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  // Position the menu based on the trigger's bounding rect
  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = Math.min(filtered.length * 38 + (searchable ? 58 : 0) + 12, 280);
    const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, [filtered.length, searchable]);

  useEffect(() => {
    if (open) {
      updateMenuPosition();
      if (searchable) setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, updateMenuPosition, searchable]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const handler = () => updateMenuPosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, updateMenuPosition]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = useCallback((val: string) => {
    if (multiple) {
      const arr = Array.isArray(selected) ? selected : [];
      onChange(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    } else {
      onChange(val === selected ? '' : val);
      setOpen(false);
      setSearch('');
    }
  }, [multiple, selected, onChange]);

  const isSelected = (val: string) => {
    if (multiple) return (Array.isArray(selected) ? selected : []).includes(val);
    return selected === val;
  };

  const displayLabel = () => {
    if (multiple) {
      const arr = Array.isArray(selected) ? selected : [];
      if (arr.length === 0) return placeholder;
      if (arr.length === 1) return options.find(o => o.value === arr[0])?.label ?? arr[0];
      return `${arr.length} selected`;
    }
    return options.find(o => o.value === selected)?.label ?? placeholder;
  };

  const selectedIcon = (() => {
    if (multiple) return null;
    return options.find(o => o.value === selected)?.icon ?? null;
  })();

  const hasValue = multiple
    ? (Array.isArray(selected) && selected.length > 0)
    : !!selected;

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(multiple ? [] : '');
  };

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.97 }}
          transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
          style={{
            ...menuStyle,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.95)',
            borderRadius: '14px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            minWidth: '180px',
          }}
        >
          {searchable && (
            <div style={{ padding: '8px 8px 0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '7px 10px',
                background: 'var(--off-white)',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}>
                <Search size={13} color="var(--text-muted)" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  style={{
                    border: 'none', background: 'transparent',
                    fontSize: '13px', color: 'var(--text-primary)',
                    width: '100%', fontFamily: 'DM Sans, sans-serif',
                  }}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}>
                    <X size={11} color="var(--text-muted)" />
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ maxHeight: '210px', overflowY: 'auto', padding: '6px' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '18px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                No results
              </div>
            ) : (
              filtered.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: '8px',
                    padding: '7px 10px',
                    background: isSelected(opt.value) ? 'var(--accent-light)' : 'transparent',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    transition: 'all 0.1s ease', textAlign: 'left',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected(opt.value))
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected(opt.value))
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {opt.icon && <span style={{ fontSize: '14px' }}>{opt.icon}</span>}
                    <span style={{
                      fontSize: '13.5px',
                      color: isSelected(opt.value) ? 'var(--accent)' : 'var(--text-primary)',
                      fontWeight: isSelected(opt.value) ? 500 : 400,
                      textTransform: 'capitalize',
                    }}>
                      {opt.label}
                    </span>
                  </span>
                  {isSelected(opt.value) && <Check size={13} color="var(--accent)" />}
                </button>
              ))
            )}
          </div>

          {multiple && Array.isArray(selected) && selected.length > 0 && (
            <div style={{ padding: '6px 10px 8px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={clearAll}
                style={{
                  fontSize: '12px', color: 'var(--text-muted)', background: 'none',
                  border: 'none', cursor: 'pointer', padding: '3px 8px',
                  borderRadius: '6px', transition: 'all 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
              >
                Clear all
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div style={{ position: 'relative' }}>
      {label && (
        <div style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--text-muted)',
          marginBottom: '6px', fontFamily: 'DM Mono, monospace',
        }}>
          {label}
        </div>
      )}

      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: '8px',
          padding: '10px 14px',
          background: open ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)',
          border: `1px solid ${open ? 'rgba(27,202,142,0.4)' : 'var(--border)'}`,
          borderRadius: '12px', cursor: 'pointer',
          transition: 'all 0.15s ease',
          boxShadow: open ? '0 0 0 3px rgba(27,202,142,0.1)' : 'var(--shadow-sm)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{
          display: 'flex', alignItems: 'center', gap: '7px',
          overflow: 'hidden', flex: 1,
        }}>
          {selectedIcon && (
            <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              {selectedIcon}
            </span>
          )}
          <span style={{
            fontSize: '14px',
            color: hasValue ? 'var(--text-primary)' : 'var(--text-muted)',
            fontWeight: hasValue ? 500 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textAlign: 'left', textTransform: 'capitalize',
          }}>
            {displayLabel()}
          </span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {hasValue && (
            <span
              onClick={clearAll}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'var(--border)', cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-strong)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--border)')}
            >
              <X size={10} color="var(--text-secondary)" />
            </span>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <ChevronDown size={15} color="var(--text-muted)" />
          </motion.span>
        </div>
      </button>

      {createPortal(menu, document.body)}
    </div>
  );
}
