import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Star, Wifi, X, Globe, ExternalLink,
  SlidersHorizontal, RotateCcw,
} from 'lucide-react';
import axios from 'axios';
import { ServerDetail } from './ServerDetail';
import { Dropdown } from './Dropdown';

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

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'downloads', label: 'Most Played' },
  { value: 'follows',   label: 'Most Followed' },
  { value: 'newest',    label: 'Newest' },
  { value: 'updated',   label: 'Recently Updated' },
];

function numToHex(n: number | null) {
  if (!n) return '#0ea5e9';
  return `#${n.toString(16).padStart(6, '0')}`;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function toOptions(arr: string[]) {
  return arr.map(v => ({ value: v, label: v.replace(/-/g, ' ') }));
}

const panel: React.CSSProperties = {
  background: 'var(--card)',
  backdropFilter: 'blur(16px)',
  border: '1px solid var(--card-border)',
  borderRadius: '12px',
  padding: '14px 16px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
};

const LIMIT = 18;

export function ServersView() {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [gameplay, setGameplay] = useState<string[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [meta, setMeta] = useState<string[]>([]);
  const [community, setCommunity] = useState<string[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [results, setResults] = useState<ServerHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selectedServer, setSelectedServer] = useState<ServerHit | null>(null);

  const [catMap, setCatMap] = useState<Record<string, string[]>>({});
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch tag data once
  useEffect(() => {
    Promise.all([
      client.get('/tag/category'),
      client.get('/tag/game_version'),
    ]).then(([catsRes, versRes]) => {
      const grouped: Record<string, string[]> = {};
      (catsRes.data as { project_type: string; header: string; name: string }[])
        .filter(c => c.project_type === 'minecraft_java_server')
        .forEach(c => {
          const key = c.header.replace('minecraft_server_', '');
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(c.name);
        });
      setCatMap(grouped);
      setAvailableVersions(
        (versRes.data as { version: string; version_type: string }[])
          .filter(v => v.version_type === 'release')
          .map(v => v.version)
          .slice(0, 40)
      );
    }).catch(console.error);
  }, []);

  const debouncedQuery = useDebounce(query, 340);

  // Search
  useEffect(() => {
    setLoading(true);
    const facets: string[][] = [['project_type:minecraft_java_server']];
    if (gameplay.length)  facets.push(gameplay.map(g  => `categories:${g}`));
    if (features.length)  facets.push(features.map(f  => `categories:${f}`));
    if (meta.length)      facets.push(meta.map(m      => `categories:${m}`));
    if (community.length) facets.push(community.map(c => `categories:${c}`));
    if (versions.length)  facets.push(versions.map(v  => `versions:${v}`));

    const params: Record<string, string | number> = {
      limit: LIMIT,
      offset: (page - 1) * LIMIT,
      index: sortBy,
      facets: JSON.stringify(facets),
    };
    if (debouncedQuery.trim()) params.query = debouncedQuery.trim();

    client.get('/search', { params })
      .then(r => { setResults(r.data.hits); setTotal(r.data.total_hits); })
      .catch(() => { setResults([]); setTotal(0); })
      .finally(() => setLoading(false));
  }, [debouncedQuery, sortBy, gameplay, features, meta, community, versions, page]);

  // Reset page on filter changes
  useEffect(() => { setPage(1); }, [debouncedQuery, sortBy, gameplay, features, meta, community, versions]);

  const resetAll = useCallback(() => {
    setGameplay([]); setFeatures([]); setMeta([]); setCommunity([]); setVersions([]);
    setSortBy('relevance');
  }, []);

  const hasActive = gameplay.length > 0 || features.length > 0 || meta.length > 0 || community.length > 0 || versions.length > 0;

  const allActiveTags = [...gameplay, ...features, ...meta, ...community, ...versions];

  const removeTag = (tag: string) => {
    if (gameplay.includes(tag))  setGameplay(p  => p.filter(x => x !== tag));
    if (features.includes(tag))  setFeatures(p  => p.filter(x => x !== tag));
    if (meta.includes(tag))      setMeta(p      => p.filter(x => x !== tag));
    if (community.includes(tag)) setCommunity(p => p.filter(x => x !== tag));
    if (versions.includes(tag))  setVersions(p  => p.filter(x => x !== tag));
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: 0, alignItems: 'flex-start' }}>

      {/* ── Sidebar ── */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}
      >
        {/* Header */}
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <SlidersHorizontal size={13} color="var(--text-3)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif' }}>
                Filters
              </span>
            </div>
            {hasActive && (
              <button
                onClick={resetAll}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  fontSize: '11px', color: 'var(--text-3)',
                  background: 'none', border: '1px solid var(--card-border)',
                  borderRadius: '6px', padding: '2px 7px', cursor: 'pointer', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
              >
                <RotateCcw size={9} /> Reset
              </button>
            )}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            {total.toLocaleString()} servers
          </p>
        </div>

        {/* Sort */}
        <FilterPanel label="Sort By">
          <Dropdown
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={v => setSortBy(v as string)}
            placeholder="Relevance"
            searchable={false}
          />
        </FilterPanel>

        {/* Gameplay */}
        {catMap.gameplay && (
          <FilterPanel label="Gameplay">
            <Dropdown
              options={toOptions(catMap.gameplay)}
              value={gameplay}
              onChange={v => setGameplay(v as string[])}
              placeholder="Any mode"
              multiple
            />
          </FilterPanel>
        )}

        {/* Features */}
        {catMap.features && (
          <FilterPanel label="Features">
            <Dropdown
              options={toOptions(catMap.features)}
              value={features}
              onChange={v => setFeatures(v as string[])}
              placeholder="Any feature"
              multiple
            />
          </FilterPanel>
        )}

        {/* Meta */}
        {catMap.meta && (
          <FilterPanel label="Meta">
            <Dropdown
              options={toOptions(catMap.meta)}
              value={meta}
              onChange={v => setMeta(v as string[])}
              placeholder="Any"
              multiple
            />
          </FilterPanel>
        )}

        {/* Community */}
        {catMap.community && (
          <FilterPanel label="Community">
            <Dropdown
              options={toOptions(catMap.community)}
              value={community}
              onChange={v => setCommunity(v as string[])}
              placeholder="Any"
              multiple
            />
          </FilterPanel>
        )}

        {/* Game Version */}
        {availableVersions.length > 0 && (
          <FilterPanel label="Game Version">
            <Dropdown
              options={availableVersions.map(v => ({ value: v, label: v }))}
              value={versions}
              onChange={v => setVersions(v as string[])}
              placeholder="Any version"
              multiple
            />
          </FilterPanel>
        )}

        {/* Active chips */}
        {hasActive && (
          <div style={{ ...panel, paddingTop: '12px' }}>
            <p style={{
              fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '8px',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              Active
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {allActiveTags.map(tag => (
                <span key={tag} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '11px', color: '#0ea5e9',
                  background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)',
                  padding: '2px 7px', borderRadius: '20px', fontWeight: 500,
                }}>
                  {tag.replace(/-/g, ' ')}
                  <button
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#0ea5e9', opacity: 0.6, lineHeight: 1 }}
                  >×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.aside>

      {/* ── Content ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: 'linear-gradient(135deg, rgba(14,165,233,0.1) 0%, rgba(27,202,142,0.06) 60%, rgba(168,85,247,0.05) 100%)',
            border: '1px solid rgba(14,165,233,0.14)',
            borderRadius: '18px',
            padding: '22px 24px 18px',
            marginBottom: '16px',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.12), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '6px' }}>
              <Wifi size={14} color="#0ea5e9" />
              <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0ea5e9', fontFamily: 'JetBrains Mono, monospace' }}>
                Minecraft Servers
              </span>
            </div>
            <h2 style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: '22px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1.1 }}>
              Find your next{' '}
              <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #1bca8e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                adventure
              </span>
            </h2>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 14px',
              background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', maxWidth: '420px',
            }}>
              <Search size={13} color="var(--text-3)" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search servers..."
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '13.5px', color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', outline: 'none' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}>
                  <X size={12} color="var(--text-3)" />
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Results grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {Array.from({ length: 9 }).map((_, i) => <ServerSkeletonCard key={i} index={i} />)}
            </motion.div>
          ) : results.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Wifi size={20} color="#0ea5e9" />
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-2)', fontFamily: 'Instrument Sans, sans-serif' }}>No servers found</p>
              <p style={{ fontSize: '13px', color: 'var(--text-3)', marginTop: '4px' }}>Try adjusting your filters</p>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
              {results.map((server, i) => (
                <ServerCard key={server.project_id} server={server} index={i} onSelect={setSelectedServer} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '28px', paddingBottom: '40px' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={paginBtnStyle(page === 1)}
            >‹ Prev</button>
            <span style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', padding: '0 4px' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={paginBtnStyle(page === totalPages)}
            >Next ›</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedServer && (
          <ServerDetail server={selectedServer} onClose={() => setSelectedServer(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={panel}>
      <p style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace',
      }}>{label}</p>
      {children}
    </div>
  );
}

function paginBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    padding: '7px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 500,
    border: '1px solid var(--card-border)', background: disabled ? 'transparent' : 'rgba(255,255,255,0.06)',
    color: disabled ? 'var(--text-3)' : 'var(--text-2)',
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    transition: 'all 0.12s', fontFamily: 'Instrument Sans, sans-serif',
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
      transition={{ duration: 0.28, delay: index * 0.03, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      data-server-card=""
      style={{
        cursor: 'pointer', borderRadius: '14px', overflow: 'hidden',
        background: 'var(--card)', backdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid var(--card-border)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'background 0.18s, border-color 0.18s',
      }}
      onHoverStart={e => {
        const el = (e.target as HTMLElement).closest('[data-server-card]') as HTMLElement;
        if (el) { el.style.background = 'var(--card-hover)'; el.style.borderColor = 'var(--card-border-hover)'; }
      }}
      onHoverEnd={e => {
        const el = (e.target as HTMLElement).closest('[data-server-card]') as HTMLElement;
        if (el) { el.style.background = 'var(--card)'; el.style.borderColor = 'var(--card-border)'; }
      }}
    >
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${accent}90, ${accent}20)` }} />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
            background: `linear-gradient(135deg, ${accent}20, ${accent}08)`,
            border: `1px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          }}>
            {server.icon_url && !imgError
              ? <img src={server.icon_url} alt={server.title} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Wifi size={18} color={accent} />
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: '13.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
              {server.title}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
              {server.display_categories?.slice(0, 3).map(cat => (
                <span key={cat} style={{ fontSize: '10px', color: '#0ea5e9', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.18)', padding: '1px 6px', borderRadius: '20px', fontWeight: 500, textTransform: 'capitalize' }}>
                  {cat.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
          <ExternalLink size={11} color="var(--text-3)" style={{ flexShrink: 0, marginTop: '2px' }} />
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '10px' }}>
          {server.description}
        </p>

        <div style={{ display: 'flex', gap: '12px', paddingTop: '8px', borderTop: '1px solid var(--card-border)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            <Users size={10} />{formatNum(server.follows)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            <Star size={10} />{formatNum(server.downloads)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ServerSkeletonCard({ index }: { index: number }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: index * 0.03 }}
      style={{ borderRadius: '14px', padding: '16px', background: 'var(--card)', border: '1px solid var(--card-border)' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} className="shimmer" />
        <div style={{ flex: 1 }}>
          <div style={{ height: '13px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', marginBottom: '7px', width: '55%' }} className="shimmer" />
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', width: '35%' }} className="shimmer" />
        </div>
      </div>
      <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', marginBottom: '4px' }} className="shimmer" />
      <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px', width: '70%' }} className="shimmer" />
    </motion.div>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
