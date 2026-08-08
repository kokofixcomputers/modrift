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

const PROJECT_TYPES = [
  { value: 'all', label: 'All types' },
  { value: 'mod', label: 'Mods' },
  { value: 'modpack', label: 'Modpacks' },
  { value: 'resourcepack', label: 'Resource Packs' },
  { value: 'shader', label: 'Shaders' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'downloads', label: 'Most Downloaded' },
  { value: 'follows', label: 'Most Followed' },
  { value: 'newest', label: 'Newest' },
  { value: 'updated', label: 'Recently Updated' },
];

const ENVIRONMENT_OPTIONS = [
  { value: 'required', label: 'Required' },
  { value: 'optional', label: 'Optional' },
  { value: 'unsupported', label: 'Unsupported' },
];

export function Sidebar({ filters, onFiltersChange, categories, gameVersions, loaders, totalResults }: SidebarProps) {
  const hasActiveFilters = filters.categories.length > 0 || filters.loaders.length > 0 ||
    filters.versions.length > 0 || filters.projectType !== 'all';

  const resetFilters = () => {
    onFiltersChange({
      categories: [],
      loaders: [],
      versions: [],
      projectType: 'all',
      sortBy: 'relevance',
    });
  };

  const loaderOptions = loaders.map(l => ({ value: l, label: l, icon: getLoaderIcon(l, 15) }));
  const versionOptions = gameVersions.slice(0, 40).map(v => ({
    value: v,
    label: v,
  }));
  const categoryOptions = categories.map(c => ({ value: c, label: c }));

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      style={{
        width: '280px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      {/* Filter header */}
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.9)',
        borderRadius: '16px',
        padding: '16px 18px',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={15} color="var(--text-secondary)" />
            <span style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
            }}>
              Filters
            </span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: 'var(--text-muted)',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              <RotateCcw size={10} /> Reset
            </button>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {totalResults.toLocaleString()} results
        </p>
      </div>

      {/* Filter panels */}
      <FilterPanel label="Sort by">
        <Dropdown
          options={SORT_OPTIONS}
          value={filters.sortBy}
          onChange={v => onFiltersChange({ sortBy: v as string, offset: 0 })}
          placeholder="Relevance"
          searchable={false}
        />
      </FilterPanel>

      <FilterPanel label="Mod loaders">
        <Dropdown
          options={loaderOptions}
          value={filters.loaders}
          onChange={v => onFiltersChange({ loaders: v as string[], offset: 0 })}
          placeholder="Any loader"
          multiple
        />
      </FilterPanel>

      <FilterPanel label="Minecraft version">
        <Dropdown
          options={versionOptions}
          value={filters.versions}
          onChange={v => onFiltersChange({ versions: v as string[], offset: 0 })}
          placeholder="Any version"
          multiple
        />
      </FilterPanel>

      <FilterPanel label="Categories">
        <Dropdown
          options={categoryOptions}
          value={filters.categories}
          onChange={v => onFiltersChange({ categories: v as string[], offset: 0 })}
          placeholder="Any category"
          multiple
        />
      </FilterPanel>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.85)',
          borderRadius: '14px',
          padding: '14px 16px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <p style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: '8px',
            fontFamily: 'DM Mono, monospace',
          }}>
            Active filters
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {filters.categories.map(c => (
              <Chip key={c} label={c} onRemove={() =>
                onFiltersChange({ categories: filters.categories.filter(x => x !== c), offset: 0 })} />
            ))}
            {filters.loaders.map(l => (
              <Chip key={l} label={l} onRemove={() =>
                onFiltersChange({ loaders: filters.loaders.filter(x => x !== l), offset: 0 })} />
            ))}
            {filters.versions.map(v => (
              <Chip key={v} label={v} onRemove={() =>
                onFiltersChange({ versions: filters.versions.filter(x => x !== v), offset: 0 })} />
            ))}
          </div>
        </div>
      )}
    </motion.aside>
  );
}

function FilterPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.8)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.9)',
      borderRadius: '14px',
      padding: '14px 16px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <p style={{
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: '10px',
        fontFamily: 'DM Mono, monospace',
      }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      fontSize: '11px',
      color: 'var(--accent)',
      background: 'var(--accent-light)',
      border: '1px solid var(--accent-mid)',
      padding: '3px 8px',
      borderRadius: '20px',
      fontWeight: 500,
      textTransform: 'capitalize',
    }}>
      {label}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--accent)',
          opacity: 0.7,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}
