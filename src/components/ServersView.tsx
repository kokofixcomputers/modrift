import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, Star, Wifi, X, Globe, ExternalLink, Gamepad2, Swords, TreePine, Blocks, Zap, Trophy, Pickaxe, Castle, Flame, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { ServerDetail } from './ServerDetail';

const BASE = 'https://api.modrinth.com/v2';
const client = axios.create({
  baseURL: BASE,
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

export interface ServerHit {
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  follows: number;
  date_modified: string;
  project_id: string;
  categories: string[];
  display_categories: string[];
  color: number | null;
}

const SERVER_CATEGORIES = [
  { id: 'all',           label: 'All',        icon: <Globe size={14} /> },
  { id: 'smp',           label: 'SMP',        icon: <TreePine size={14} /> },
  { id: 'minigames',     label: 'Minigames',  icon: <Gamepad2 size={14} /> },
  { id: 'bedwars',       label: 'Bedwars',    icon: <Swords size={14} /> },
  { id: 'skyblock',      label: 'SkyBlock',   icon: <Blocks size={14} /> },
  { id: 'pvp',           label: 'PvP',        icon: <Zap size={14} /> },
  { id: 'factions',      label: 'Factions',   icon: <Castle size={14} /> },
  { id: 'survival-mode', label: 'Survival',   icon: <TreePine size={14} /> },
  { id: 'economy',       label: 'Economy',    icon: <Trophy size={14} /> },
  { id: 'kitpvp',        label: 'KitPvP',     icon: <Swords size={14} /> },
  { id: 'prison',        label: 'Prison',     icon: <ShieldCheck size={14} /> },
  { id: 'anarchy',       label: 'Anarchy',    icon: <Flame size={14} /> },
  { id: 'creative-mode', label: 'Creative',   icon: <Pickaxe size={14} /> },
  { id: 'roleplay',      label: 'Roleplay',   icon: <Pickaxe size={14} /> },
  { id: 'rpg',           label: 'RPG',        icon: <Pickaxe size={14} /> },
  { id: 'pokemon',       label: 'Pokémon',    icon: <Blocks size={14} /> },
  { id: 'lifesteal',     label: 'Lifesteal',  icon: <Flame size={14} /> },
  { id: 'network',       label: 'Network',    icon: <Globe size={14} /> },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'downloads', label: 'Most Played' },
  { value: 'follows',   label: 'Most Followed' },
  { value: 'newest',    label: 'Newest' },
  { value: 'updated',   label: 'Recently Updated' },
];

function numToHex(n: number | null) {
  if (!n) return '#1bca8e';
  return `#${n.toString(16).padStart(6, '0')}`;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function ServersView() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [results, setResults] = useState<ServerHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedServer, setSelectedServer] = useState<ServerHit | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const LIMIT = 18;

  useEffect(() => {
    setLoading(true);
    const facets: string[][] = [['project_type:minecraft_java_server']];
    if (category !== 'all') facets.push([`categories:${category}`]);

    const params: Record<string, string | number> = {
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
      index: sortBy,
    };
    if (query.trim()) params.query = query.trim();
    params.facets = JSON.stringify(facets);

    client.get('/search', { params })
      .then(r => { setResults(r.data.hits); setTotal(r.data.total_hits); })
      .catch(() => { setResults([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [query, category, sortBy, page]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [query, category, sortBy]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      {/* Server hero banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.12) 0%, rgba(27,202,142,0.08) 50%, rgba(168,85,247,0.06) 100%)',
          border: '1px solid rgba(14,165,233,0.15)',
          borderRadius: '20px',
          padding: '28px 28px 22px',
          marginBottom: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: '-40px', right: '-40px',
          width: '160px', height: '160px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.15), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-30px', left: '30%',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27,202,142,0.12), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Wifi size={16} color="#0ea5e9" />
            <span style={{
              fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#0ea5e9',
              fontFamily: 'DM Mono, monospace',
            }}>
              Minecraft Servers
            </span>
          </div>
          <h2 style={{
            fontFamily: 'Syne, sans-serif', fontSize: '26px', fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
            marginBottom: '6px', lineHeight: 1.1,
          }}>
            Find your next{' '}
            <span style={{
              background: 'linear-gradient(135deg, #0ea5e9, #1bca8e)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              adventure
            </span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
            Browse community servers across every game mode.
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.95)',
            borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            maxWidth: '480px',
          }}>
            <Search size={14} color="var(--text-muted)" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search servers..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'DM Sans, sans-serif',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                <X size={13} color="var(--text-muted)" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Category pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{
          display: 'flex', gap: '6px', marginBottom: '16px',
          overflowX: 'auto', paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}
        className="tab-strip"
      >
        {SERVER_CATEGORIES.map(cat => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px', borderRadius: '20px', flexShrink: 0,
                border: active ? '1px solid rgba(14,165,233,0.4)' : '1px solid var(--border)',
                background: active ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.7)',
                color: active ? '#0ea5e9' : 'var(--text-secondary)',
                fontSize: '12px', fontWeight: active ? 600 : 400, cursor: 'pointer',
                transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                backdropFilter: 'blur(8px)',
                boxShadow: active ? '0 0 0 3px rgba(14,165,233,0.08)' : 'none',
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.95)'; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.7)'; }}
            >
              {cat.icon}{cat.label}
            </button>
          );
        })}
      </motion.div>

      {/* Sort + count bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {loading ? 'Searching...' : `${total.toLocaleString()} servers`}
        </span>
        <div style={{ display: 'flex', gap: '5px' }}>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '12px',
                border: sortBy === opt.value ? '1px solid rgba(14,165,233,0.35)' : '1px solid var(--border)',
                background: sortBy === opt.value ? 'rgba(14,165,233,0.08)' : 'transparent',
                color: sortBy === opt.value ? '#0ea5e9' : 'var(--text-muted)',
                cursor: 'pointer', transition: 'all 0.12s', fontWeight: sortBy === opt.value ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Server grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}
          >
            {Array.from({ length: 9 }).map((_, i) => <ServerSkeletonCard key={i} index={i} />)}
          </motion.div>
        ) : results.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '80px 20px' }}
          >
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Wifi size={24} color="#0ea5e9" />
            </div>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No servers found
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Try a different category or search term.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}
          >
            {results.map((server, i) => (
              <ServerCard key={server.project_id} server={server} index={i} onSelect={setSelectedServer} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '32px', paddingBottom: '40px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={paginBtnStyle(page === 1)}
          >
            ‹ Prev
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', padding: '0 4px' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={paginBtnStyle(page === totalPages)}
          >
            Next ›
          </button>
        </div>
      )}
      <AnimatePresence>
        {selectedServer && (
          <ServerDetail server={selectedServer} onClose={() => setSelectedServer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function paginBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
    border: '1px solid var(--border)', background: disabled ? 'transparent' : 'rgba(255,255,255,0.85)',
    color: disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'all 0.12s',
  };
}

function ServerCard({ server, index, onSelect }: { server: ServerHit; index: number; onSelect: (s: ServerHit) => void }) {
  const [imgError, setImgError] = useState(false);
  const accent = numToHex(server.color);

  return (
    <motion.div
      onClick={() => onSelect(server)}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.035, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      style={{
        cursor: 'pointer',
        borderRadius: '16px', overflow: 'hidden',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.92)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        position: 'relative',
      }}
      onHoverStart={(e) => {
        const el = (e.target as HTMLElement).closest('[data-server-card]') as HTMLElement;
        if (el) {
          el.style.boxShadow = '0 8px 28px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.9)';
          el.style.borderColor = 'rgba(255,255,255,1)';
        }
      }}
      onHoverEnd={(e) => {
        const el = (e.target as HTMLElement).closest('[data-server-card]') as HTMLElement;
        if (el) {
          el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)';
          el.style.borderColor = 'rgba(255,255,255,0.92)';
        }
      }}
      data-server-card=""
    >
      {/* Accent strip */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, ${accent}90, ${accent}20)`,
      }} />

      <div style={{ padding: '18px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
          {/* Icon */}
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
            border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {server.icon_url && !imgError ? (
              <img src={server.icon_url} alt={server.title}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Wifi size={20} color={accent} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: 700,
                color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {server.title}
              </h3>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {server.display_categories?.slice(0, 3).map(cat => (
                <span key={cat} style={{
                  fontSize: '10px', color: '#0ea5e9', background: 'rgba(14,165,233,0.1)',
                  border: '1px solid rgba(14,165,233,0.2)', padding: '1px 6px',
                  borderRadius: '20px', fontWeight: 500, textTransform: 'capitalize',
                }}>
                  {cat}
                </span>
              ))}
            </div>
          </div>
          <ExternalLink size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
        </div>

        <p style={{
          fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: '12px',
        }}>
          {server.description}
        </p>

        <div style={{
          display: 'flex', gap: '12px',
          paddingTop: '10px', borderTop: '1px solid var(--border)',
        }}>
          <Stat icon={<Users size={11} />} value={formatNum(server.follows)} />
          <Stat icon={<Star size={11} />} value={formatNum(server.downloads)} />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
      {icon}{value}
    </span>
  );
}

function ServerSkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      style={{ borderRadius: '16px', padding: '18px', background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.85)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div style={{ display: 'flex', gap: '12px', marginBottom: '10px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--border)', flexShrink: 0 }} className="shimmer" />
        <div style={{ flex: 1 }}>
          <div style={{ height: '14px', background: 'var(--border)', borderRadius: '6px', marginBottom: '8px', width: '55%' }} className="shimmer" />
          <div style={{ height: '11px', background: 'var(--border)', borderRadius: '6px', width: '35%' }} className="shimmer" />
        </div>
      </div>
      <div style={{ height: '11px', background: 'var(--border)', borderRadius: '6px', marginBottom: '5px' }} className="shimmer" />
      <div style={{ height: '11px', background: 'var(--border)', borderRadius: '6px', width: '70%' }} className="shimmer" />
    </motion.div>
  );
}
