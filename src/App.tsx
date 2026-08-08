import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, Sparkles, TrendingUp, Package, Layers, Image, Zap, Box, Plug, Server } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ModCard } from './components/ModCard';
import { ModDetail } from './components/ModDetail';
import { ServersView } from './components/ServersView';
import { searchProjects, getCategories, getGameVersions, getLoaders } from './api/modrinth';
import type { SearchHit, SearchFilters } from './types/modrinth';
import { LanguageProvider } from './contexts/LanguageContext';

const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  categories: [],
  loaders: [],
  versions: [],
  projectType: 'all',
  sortBy: 'relevance',
  limit: 20,
  offset: 0,
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function App() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [results, setResults] = useState<SearchHit[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMod, setSelectedMod] = useState<SearchHit | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [gameVersions, setGameVersions] = useState<string[]>([]);
  const [allLoaders, setAllLoaders] = useState<{ name: string; types: string[] }[]>([]);

  const debouncedQuery = useDebounce(filters.query, 350);

  // Load tag data
  useEffect(() => {
    Promise.all([getCategories(), getGameVersions(), getLoaders()]).then(([cats, gvs, lrs]) => {
      setCategories(cats.filter(c => c.project_type === 'mod').map(c => c.name));
      setGameVersions(gvs.filter(v => v.version_type === 'release').map(v => v.version));
      setAllLoaders(lrs.map(l => ({ name: l.name, types: l.supported_project_types })));
    }).catch(console.error);
  }, []);

  // Show mod loaders for mod/all views; plugin + proxy platform loaders for plugin view
  const PROXY_PLATFORMS = new Set(['velocity', 'bungeecord', 'waterfall', 'geyser', 'geyser_plugin']);
  const loaders = allLoaders
    .filter(l => {
      if (filters.projectType === 'plugin') {
        return l.types.includes('plugin') || PROXY_PLATFORMS.has(l.name.toLowerCase());
      }
      if (filters.projectType === 'mod') return l.types.includes('mod');
      return l.types.includes('mod');
    })
    .map(l => l.name);

  // Search on filter change
  useEffect(() => {
    const activeFilters = { ...filters, query: debouncedQuery };
    setLoading(true);
    setError(null);

    searchProjects(activeFilters)
      .then(data => {
        setResults(data.hits);
        setTotalHits(data.total_hits);
      })
      .catch(err => {
        setError(err?.message ?? 'Failed to fetch results');
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, filters.categories, filters.loaders, filters.versions, filters.projectType, filters.sortBy, filters.limit, filters.offset]);

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFilters(prev => {
      // Clear loaders when switching project type to avoid cross-type stale filters
      if (partial.projectType && partial.projectType !== prev.projectType) {
        return { ...prev, ...partial, loaders: [] };
      }
      return { ...prev, ...partial };
    });
  }, []);

  const totalPages = Math.ceil(totalHits / filters.limit);
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;

  const goToPage = (page: number) => {
    const newOffset = (page - 1) * filters.limit;
    updateFilters({ offset: newOffset });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <LanguageProvider>
    <div style={{ minHeight: '100vh' }}>
      <Header
        query={filters.query}
        onQueryChange={q => updateFilters({ query: q, offset: 0 })}
      />

      {/* Hero banner (only on empty query + page 1) */}
      {!filters.query && filters.offset === 0 && filters.categories.length === 0 &&
        filters.loaders.length === 0 && filters.versions.length === 0 && (
        <HeroBanner />
      )}

      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        gap: '28px',
        alignItems: 'flex-start',
      }}>
        {/* Sidebar — hidden on Servers tab */}
        {filters.projectType !== 'server' && (
          <Sidebar
            filters={filters}
            onFiltersChange={updateFilters}
            categories={categories}
            gameVersions={gameVersions}
            loaders={loaders}
            totalResults={totalHits}
          />
        )}

        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <ProjectTypeTabs
            value={filters.projectType}
            onChange={t => updateFilters({ projectType: t, offset: 0 })}
          />

          {filters.projectType === 'server' ? (
            <ServersView />
          ) : (
          <div>

          {/* Sort / view options bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'flex' }}
                >
                  <Loader2 size={14} color="var(--text-muted)" />
                </motion.div>
              ) : (
                <TrendingUp size={14} color="var(--text-muted)" />
              )}
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {loading ? 'Searching...' : `${totalHits.toLocaleString()} results`}
                {filters.query && ` for "${filters.query}"`}
              </span>
            </div>

            {/* Mini pagination at top */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    opacity: currentPage === 1 ? 0.4 : 1, transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (currentPage !== 1) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)'; }}
                >
                  <ChevronLeft size={13} color="var(--text-secondary)" />
                </button>
                <span style={{
                  fontSize: '12px', color: 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap',
                }}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    width: '28px', height: '28px', borderRadius: '8px',
                    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    opacity: currentPage === totalPages ? 0.4 : 1, transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (currentPage !== totalPages) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)'; }}
                >
                  <ChevronRight size={13} color="var(--text-secondary)" />
                </button>
              </div>
            )}
            {totalPages <= 1 && (
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
                Page 1 of 1
              </span>
            )}
          </div>

          {/* Error state */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '16px 20px',
                background: 'rgba(239, 68, 68, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '14px',
                marginBottom: '20px',
              }}
            >
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ fontSize: '14px', color: '#ef4444' }}>{error}</span>
            </motion.div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 20px',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--accent-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--accent-mid)',
              }}>
                <Package size={24} color="var(--accent)" />
              </div>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                No results found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '300px' }}>
                Try adjusting your filters or search with a different query.
              </p>
            </motion.div>
          )}

          {/* Results grid */}
          <AnimatePresence mode="wait">
            {!error && (
              <motion.div
                key={`${filters.offset}-${debouncedQuery}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                  gap: '14px',
                }}
              >
                {(loading ? Array.from({ length: 12 }) : results).map((hit, i) =>
                  loading ? (
                    <SkeletonCard key={i} index={i} />
                  ) : (
                    <ModCard
                      key={(hit as SearchHit).project_id}
                      hit={hit as SearchHit}
                      index={i}
                      onClick={() => setSelectedMod(hit as SearchHit)}
                    />
                  )
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
          </div>
          )}
        </div>
      </main>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedMod && (
          <ModDetail
            hit={selectedMod}
            onClose={() => setSelectedMod(null)}
            contextType={filters.projectType}
          />
        )}
      </AnimatePresence>
    </div>
    </LanguageProvider>
  );
}

function HeroBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      style={{
        background: 'linear-gradient(135deg, rgba(27,202,142,0.06) 0%, rgba(14,165,233,0.04) 100%)',
        borderBottom: '1px solid rgba(27,202,142,0.12)',
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'var(--accent-light)',
            border: '1px solid var(--accent-mid)',
            borderRadius: '20px',
            marginBottom: '16px',
          }}
        >
          <Sparkles size={12} color="var(--accent)" />
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--accent)',
            letterSpacing: '0.03em',
          }}>
            Better Modrinth
          </span>
        </motion.div>

        <motion.h1
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '42px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '14px',
          }}
        >
          Discover{' '}
          <span style={{
            background: 'linear-gradient(135deg, #1bca8e 0%, #0ea5e9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Minecraft mods
          </span>
          {' '}with clarity.
        </motion.h1>

        <motion.p
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            maxWidth: '440px',
            margin: '0 auto',
          }}
        >
          A reimagined frontend for Modrinth. Browse, filter, and download mods with a clean modern interface.
        </motion.p>
      </div>
    </motion.div>
  );
}

const PROJECT_TYPES = [
  { value: 'all', label: 'All', icon: <Box size={14} /> },
  { value: 'mod', label: 'Mods', icon: <Package size={14} /> },
  { value: 'modpack', label: 'Modpacks', icon: <Layers size={14} /> },
  { value: 'resourcepack', label: 'Resource Packs', icon: <Image size={14} /> },
  { value: 'shader', label: 'Shaders', icon: <Zap size={14} /> },
  { value: 'plugin', label: 'Plugins', icon: <Plug size={14} /> },
  { value: 'server', label: 'Servers', icon: <Server size={14} /> },
];

function ProjectTypeTabs({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="tab-strip" style={{
      display: 'flex',
      gap: '4px',
      marginBottom: '18px',
      padding: '4px',
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(10px)',
      border: '1px solid var(--border)',
      borderRadius: '14px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {PROJECT_TYPES.map(type => {
        const active = value === type.value;
        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '10px',
              border: active ? '1px solid var(--accent-mid)' : '1px solid transparent',
              background: active ? 'var(--accent-light)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: active ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              fontFamily: 'DM Sans, sans-serif',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
              }
            }}
          >
            <span style={{ opacity: active ? 1 : 0.7 }}>{type.icon}</span>
            {type.label}
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
        borderRadius: '18px',
        padding: '20px',
        background: 'rgba(255,255,255,0.75)',
        border: '1px solid rgba(255,255,255,0.85)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ width: '54px', height: '54px', borderRadius: '13px', background: 'var(--border)', flexShrink: 0 }} className="shimmer" />
        <div style={{ flex: 1 }}>
          <div style={{ height: '16px', background: 'var(--border)', borderRadius: '6px', marginBottom: '8px', width: '60%' }} className="shimmer" />
          <div style={{ height: '12px', background: 'var(--border)', borderRadius: '6px', width: '40%' }} className="shimmer" />
        </div>
      </div>
      <div style={{ height: '12px', background: 'var(--border)', borderRadius: '6px', marginBottom: '6px' }} className="shimmer" />
      <div style={{ height: '12px', background: 'var(--border)', borderRadius: '6px', width: '75%' }} className="shimmer" />
    </motion.div>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const maxVisible = 7;
  const pages: (number | '...')[] = [];

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '40px',
        paddingBottom: '40px',
      }}
    >
      <PageBtn
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        icon={<ChevronLeft size={15} />}
      />

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} style={{
            width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', color: 'var(--text-muted)',
          }}>
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: currentPage === page
                ? '1px solid var(--accent-mid)'
                : '1px solid var(--border)',
              background: currentPage === page
                ? 'var(--accent-light)'
                : 'rgba(255,255,255,0.8)',
              color: currentPage === page ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: currentPage === page ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.12s',
              fontFamily: 'DM Mono, monospace',
            }}
            onMouseEnter={e => {
              if (currentPage !== page) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.95)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              }
            }}
            onMouseLeave={e => {
              if (currentPage !== page) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }
            }}
          >
            {page}
          </button>
        )
      )}

      <PageBtn
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        icon={<ChevronRight size={15} />}
      />
    </motion.div>
  );
}

function PageBtn({ onClick, disabled, icon }: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.12s',
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.95)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.8)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
      }}
    >
      {icon}
    </button>
  );
}
