import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Package, Layers, Image, Zap, Box, Plug, Server, Database,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { ModCard } from '../components/ModCard';
import { ServersView } from '../components/ServersView';
import { searchProjects, getCategories, getGameVersions, getLoaders } from '../api/modrinth';
import type { SearchHit, SearchFilters } from '../types/modrinth';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const PROJECT_TYPES = [
  { value: 'all',          label: 'All',            icon: <Box size={13} /> },
  { value: 'mod',          label: 'Mods',           icon: <Package size={13} /> },
  { value: 'modpack',      label: 'Modpacks',       icon: <Layers size={13} /> },
  { value: 'resourcepack', label: 'Resource Packs', icon: <Image size={13} /> },
  { value: 'datapack',     label: 'Datapacks',      icon: <Database size={13} /> },
  { value: 'shader',       label: 'Shaders',        icon: <Zap size={13} /> },
  { value: 'plugin',       label: 'Plugins',        icon: <Plug size={13} /> },
  { value: 'server',       label: 'Servers',        icon: <Server size={13} /> },
];

// Loaders that belong only in Plugins, never in Mods
const PLUGIN_ONLY = new Set([
  'paper','spigot','bukkit','folia','purpur','sponge',
  'velocity','bungeecord','waterfall','geyser','geyser_plugin',
]);
const LIMIT = 20;

export default function BrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Derive filter state from URL
  const query       = searchParams.get('q')    ?? '';
  const projectType = searchParams.get('type') ?? 'all';
  const sortBy      = searchParams.get('sort') ?? 'relevance';
  const loaders     = searchParams.getAll('loader');
  const versions    = searchParams.getAll('ver');
  const categories  = searchParams.getAll('cat');
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const offset      = (page - 1) * LIMIT;

  const filters: SearchFilters = { query, projectType, sortBy, loaders, versions, categories, limit: LIMIT, offset };

  const updateFilters = useCallback((partial: Partial<SearchFilters & { offset?: number }>) => {
    setSearchParams(prev => {
      const n = new URLSearchParams(prev);

      if ('query' in partial)       { if (partial.query) n.set('q', partial.query); else n.delete('q'); }
      if ('projectType' in partial) { if (partial.projectType && partial.projectType !== 'all') n.set('type', partial.projectType!); else n.delete('type'); }
      if ('sortBy' in partial)      { if (partial.sortBy && partial.sortBy !== 'relevance') n.set('sort', partial.sortBy!); else n.delete('sort'); }
      if ('loaders' in partial)     { n.delete('loader'); partial.loaders?.forEach(l => n.append('loader', l)); }
      if ('versions' in partial)    { n.delete('ver'); partial.versions?.forEach(v => n.append('ver', v)); }
      if ('categories' in partial)  { n.delete('cat'); partial.categories?.forEach(c => n.append('cat', c)); }

      // Reset page when anything else changes
      const resetsPage = 'query' in partial || 'projectType' in partial || 'sortBy' in partial ||
                         'loaders' in partial || 'versions' in partial || 'categories' in partial;
      if (resetsPage || ('offset' in partial && partial.offset === 0)) n.delete('page');

      if ('offset' in partial && partial.offset !== undefined && partial.offset !== 0) {
        n.set('page', String(Math.floor(partial.offset / LIMIT) + 1));
      }

      // Clear loaders when switching project type
      if ('projectType' in partial && partial.projectType !== projectType) n.delete('loader');

      return n;
    }, { replace: true });
  }, [setSearchParams, projectType]);

  const debouncedQ = useDebounce(query, 340);

  const [results, setResults]     = useState<SearchHit[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [tagCategories, setTagCategories] = useState<string[]>([]);
  const [gameVersions, setGameVersions]   = useState<string[]>([]);
  const [allLoaders, setAllLoaders]       = useState<{ name: string; types: string[] }[]>([]);

  // Load tag data once
  useEffect(() => {
    Promise.all([getCategories(), getGameVersions(), getLoaders()]).then(([cats, gvs, lrs]) => {
      setTagCategories(cats.filter(c => c.project_type === 'mod').map(c => c.name));
      setGameVersions(gvs.filter(v => v.version_type === 'release').map(v => v.version));
      setAllLoaders(lrs.map(l => ({ name: l.name, types: l.supported_project_types })));
    }).catch(console.error);
  }, []);

  const loaderOptions = allLoaders.filter(l => {
    const name = l.name.toLowerCase();
    if (projectType === 'plugin') return PLUGIN_ONLY.has(name);
    if (projectType === 'datapack') return l.types.includes('datapack');
    return l.types.includes('mod') && !PLUGIN_ONLY.has(name);
  }).map(l => l.name);

  // Search
  useEffect(() => {
    if (projectType === 'server') return;
    setLoading(true);
    setError(null);
    const f = { ...filters, query: debouncedQ };
    searchProjects(f)
      .then(d => { setResults(d.hits); setTotalHits(d.total_hits); })
      .catch(err => { setError(err?.message ?? 'Failed to fetch results'); setResults([]); })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, projectType, sortBy, loaders.join(','), versions.join(','), categories.join(','), offset]);

  const totalPages  = Math.ceil(totalHits / LIMIT);
  const currentPage = page;

  const goToPage = (p: number) => {
    updateFilters({ offset: (p - 1) * LIMIT });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showHero = !query && page === 1 && loaders.length === 0 && versions.length === 0 && categories.length === 0;

  return (
    <div style={{ flex: 1 }}>
      {showHero && <Hero />}

      <main style={{
        maxWidth: '1440px', margin: '0 auto',
        padding: '28px 24px',
        display: 'flex', gap: '24px', alignItems: 'flex-start',
      }}>
        {projectType !== 'server' && (
          <Sidebar
            filters={filters}
            onFiltersChange={updateFilters}
            categories={tagCategories}
            gameVersions={gameVersions}
            loaders={loaderOptions}
            totalResults={totalHits}
          />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <TypeTabs value={projectType} onChange={t => updateFilters({ projectType: t, offset: 0 })} />

          {projectType === 'server' ? (
            <ServersView />
          ) : (
            <>
              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {loading
                    ? <><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ display: 'flex' }}><Loader2 size={12} /></motion.span> Searching…</>
                    : <>{totalHits.toLocaleString()} results{query && ` for "${query}"`}</>}
                </span>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <PageBtn onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} icon={<ChevronLeft size={12} />} />
                    <span style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', minWidth: '42px', textAlign: 'center' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <PageBtn onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} icon={<ChevronRight size={12} />} />
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '14px 16px', borderRadius: '12px',
                  background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)',
                  marginBottom: '16px',
                }}>
                  <AlertCircle size={14} color="var(--red)" />
                  <span style={{ fontSize: '13px', color: 'var(--red)' }}>{error}</span>
                </div>
              )}

              {!loading && !error && results.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 20px', gap: '10px', textAlign: 'center' }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Package size={20} color="var(--accent)" />
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>No results found</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', maxWidth: '280px' }}>Try adjusting your filters or a different search query.</p>
                </motion.div>
              )}

              <AnimatePresence mode="wait">
                {!error && (
                  <motion.div
                    key={`${offset}-${debouncedQ}-${projectType}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '10px' }}
                  >
                    {(loading ? Array.from({ length: 12 }) : results).map((hit, i) =>
                      loading
                        ? <SkeletonCard key={i} index={i} />
                        : <ModCard key={(hit as SearchHit).project_id} hit={hit as SearchHit} index={i} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!loading && !error && totalPages > 1 && (
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={goToPage} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '52px 24px 48px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
            marginBottom: '20px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>
            BETTER MODRINTH
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          style={{
            fontFamily: 'Instrument Sans, sans-serif',
            fontSize: '40px', fontWeight: 700,
            color: 'var(--text)', lineHeight: 1.1,
            letterSpacing: '-0.03em', marginBottom: '14px',
          }}
        >
          Browse Minecraft content
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #1bca8e 20%, #60a5fa 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            without the noise.
          </span>
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          style={{ fontSize: '15px', color: 'var(--text-2)', lineHeight: 1.65 }}
        >
          A focused frontend for Modrinth. Fast search, clean layout, one-click installs.
        </motion.p>
      </div>
    </motion.div>
  );
}

function TypeTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="tab-strip" style={{
      display: 'flex', gap: '2px', marginBottom: '16px',
      padding: '3px',
      background: 'var(--card)',
      border: '1px solid var(--card-border)',
      borderRadius: '11px',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    }}>
      {PROJECT_TYPES.map(t => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 11px', borderRadius: '8px',
              border: active ? '1px solid var(--accent-border)' : '1px solid transparent',
              background: active ? 'var(--accent-dim)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '12px', fontWeight: active ? 600 : 400,
              cursor: 'pointer', transition: 'all 0.14s',
              fontFamily: 'Instrument Sans, sans-serif', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; } }}
            onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.background = 'transparent'; } }}
          >
            <span style={{ opacity: active ? 1 : 0.6 }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      style={{
        borderRadius: '14px', padding: '16px',
        background: 'var(--card)', border: '1px solid var(--card-border)',
      }}
    >
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '11px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} className="shimmer" />
        <div style={{ flex: 1 }}>
          <div style={{ height: '14px', borderRadius: '5px', marginBottom: '7px', width: '55%', background: 'rgba(255,255,255,0.06)' }} className="shimmer" />
          <div style={{ height: '11px', borderRadius: '5px', width: '35%', background: 'rgba(255,255,255,0.06)' }} className="shimmer" />
        </div>
      </div>
      <div style={{ height: '11px', borderRadius: '5px', marginBottom: '5px', background: 'rgba(255,255,255,0.06)' }} className="shimmer" />
      <div style={{ height: '11px', borderRadius: '5px', width: '70%', background: 'rgba(255,255,255,0.06)' }} className="shimmer" />
    </motion.div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end   = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '36px', paddingBottom: '40px' }}
    >
      <PageBtn onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} icon={<ChevronLeft size={14} />} />
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-3)' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p as number)}
            style={{
              width: '34px', height: '34px', borderRadius: '8px',
              border: currentPage === p ? '1px solid var(--accent-border)' : '1px solid var(--card-border)',
              background: currentPage === p ? 'var(--accent-dim)' : 'var(--card)',
              color: currentPage === p ? 'var(--accent)' : 'var(--text-3)',
              fontSize: '12px', fontWeight: currentPage === p ? 700 : 400,
              cursor: 'pointer', transition: 'all 0.12s',
              fontFamily: 'JetBrains Mono, monospace',
            }}
            onMouseEnter={e => { if (currentPage !== p) { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; } }}
            onMouseLeave={e => { if (currentPage !== p) { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; } }}
          >
            {p}
          </button>
        )
      )}
      <PageBtn onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} icon={<ChevronRight size={14} />} />
    </motion.div>
  );
}

function PageBtn({ onClick, disabled, icon }: { onClick: () => void; disabled: boolean; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      style={{
        width: '34px', height: '34px', borderRadius: '8px',
        border: '1px solid var(--card-border)', background: 'var(--card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1, transition: 'all 0.12s', color: 'var(--text-2)',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
    >
      {icon}
    </button>
  );
}
