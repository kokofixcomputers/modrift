import { motion } from 'framer-motion';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Dropdown } from './Dropdown';
import { getLoaderIcon } from './LoaderIcons';
import type { SearchFilters } from '../types/modrinth';

interface SidebarProps {
  filters: SearchFilters;
  onFiltersChange: (f: Partial<SearchFilters>) => void;
  categories: string[];
  gameVersions: string[];
  loaders: string[];
  totalResults: number;
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'follows', label: 'Most Followed' },
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently Updated' },
];

const panel: React.CSSProperties = {
  background: 'var(--card)',
  backdropFilter: 'blur(16px)',
  border: '1px solid var(--card-border)',
  borderRadius: '12px',
  padding: '14px 16px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
};

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={panel}>
      <p style={{
        fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--text-3)',
        marginBottom: '10px', fontFamily: 'JetBrains Mono, monospace',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

export function Sidebar({ filters, onFiltersChange, categories, gameVersions, loaders, totalResults }: SidebarProps) {
  const hasActive = filters.categories.length > 0 || filters.loaders.length > 0 || filters.versions.length > 0;

  const reset = () => onFiltersChange({ categories: [], loaders: [], versions: [], sortBy: 'relevance' });

  const LOADER_LABELS: Record<string, string> = {
    modloader: "Risugami's ModLoader",
  };
  const loaderOptions = loaders.map(l => ({ value: l, label: LOADER_LABELS[l.toLowerCase()] ?? l, icon: getLoaderIcon(l, 14) }));
  const versionOptions = gameVersions.slice(0, 40).map(v => ({ value: v, label: v }));
  const categoryOptions = categories.map(c => ({ value: c, label: c }));

  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
      style={{ width: '256px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}
    >
      {/* Header */}
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <SlidersHorizontal size={13} color="var(--text-3)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif' }}>
              Filters
            </span>
          </div>
          {hasActive && (
            <button
              onClick={reset}
              style={{
                display: 'flex', alignItems: 'center', gap: '3px',
                fontSize: '11px', color: 'var(--text-3)',
                background: 'none', border: '1px solid var(--card-border)',
                borderRadius: '6px', padding: '2px 7px', cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
            >
              <RotateCcw size={9} /> Reset
            </button>
          )}
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
          {totalResults.toLocaleString()} results
        </p>
      </div>

      <FilterGroup label="Sort by">
        <Dropdown
          options={SORT_OPTIONS}
          value={filters.sortBy}
          onChange={v => onFiltersChange({ sortBy: v as string, offset: 0 })}
          placeholder="Relevance"
          searchable={false}
        />
      </FilterGroup>

      <FilterGroup label="Mod loaders">
        <Dropdown
          options={loaderOptions}
          value={filters.loaders}
          onChange={v => onFiltersChange({ loaders: v as string[], offset: 0 })}
          placeholder="Any loader"
          multiple
        />
      </FilterGroup>

      <FilterGroup label="Minecraft version">
        <Dropdown
          options={versionOptions}
          value={filters.versions}
          onChange={v => onFiltersChange({ versions: v as string[], offset: 0 })}
          placeholder="Any version"
          multiple
        />
      </FilterGroup>

      <FilterGroup label="Categories">
        <Dropdown
          options={categoryOptions}
          value={filters.categories}
          onChange={v => onFiltersChange({ categories: v as string[], offset: 0 })}
          placeholder="Any category"
          multiple
        />
      </FilterGroup>

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
            {[...filters.categories, ...filters.loaders, ...filters.versions].map(tag => (
              <span key={tag} style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', color: 'var(--accent)',
                background: 'var(--accent-dim)', border: '1px solid var(--accent-border)',
                padding: '2px 7px', borderRadius: '20px', fontWeight: 500,
              }}>
                {tag}
                <button
                  onClick={() => {
                    if (filters.categories.includes(tag)) onFiltersChange({ categories: filters.categories.filter(x => x !== tag), offset: 0 });
                    else if (filters.loaders.includes(tag)) onFiltersChange({ loaders: filters.loaders.filter(x => x !== tag), offset: 0 });
                    else onFiltersChange({ versions: filters.versions.filter(x => x !== tag), offset: 0 });
                  }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', opacity: 0.6, lineHeight: 1 }}
                >×</button>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
}
