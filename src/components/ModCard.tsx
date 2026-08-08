import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Heart, Clock, ExternalLink, Package, Layers, Cpu, Plug, Zap, Image } from 'lucide-react';
import type { SearchHit } from '../types/modrinth';
import { formatDownloads, formatDate, numToHex } from '../api/modrinth';
import { getLoaderIcon, LOADER_COLORS } from './LoaderIcons';

interface ModCardProps {
  hit: SearchHit;
  index: number;
  onClick: () => void;
}

const PROJECT_TYPE_META: Record<string, { icon: React.ReactNode; label: string }> = {
  mod:          { icon: <Package size={11} />,  label: 'Mod' },
  modpack:      { icon: <Layers size={11} />,   label: 'Modpack' },
  resourcepack: { icon: <Image size={11} />,    label: 'Resource Pack' },
  shader:       { icon: <Zap size={11} />,      label: 'Shader' },
  plugin:       { icon: <Plug size={11} />,     label: 'Plugin' },
};


export function ModCard({ hit, index, onClick }: ModCardProps) {
  const [imgError, setImgError] = useState(false);
  const accentHex = numToHex(hit.color);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.4, 0, 0.2, 1] }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderRadius: '18px',
        overflow: 'hidden',
        position: 'relative',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.9)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
      }}
      onHoverStart={(e) => {
        const el = (e.target as HTMLElement).closest('[data-card]') as HTMLElement;
        if (el) {
          el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)';
          el.style.borderColor = 'rgba(255,255,255,1)';
          el.style.background = 'rgba(255,255,255,0.92)';
        }
      }}
      data-card=""
    >
      {/* Accent top strip */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${accentHex}80, ${accentHex}20)`,
      }} />

      <div style={{ padding: '20px', paddingTop: '23px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          {/* Icon */}
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '13px',
            overflow: 'hidden',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${accentHex}22, ${accentHex}08)`,
            border: `1px solid ${accentHex}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${accentHex}20`,
          }}>
            {hit.icon_url && !imgError ? (
              <img
                src={hit.icon_url}
                alt={hit.title}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '24px' }}>
                <Package size={24} color={accentHex} />
              </span>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
              <h3 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}>
                {hit.title}
              </h3>
              <span style={{
                fontSize: '10px',
                color: accentHex,
                background: `${accentHex}15`,
                border: `1px solid ${accentHex}30`,
                padding: '2px 7px',
                borderRadius: '20px',
                fontWeight: 600,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontFamily: 'DM Mono, monospace',
              }}>
                {(PROJECT_TYPE_META[hit.project_type] ?? PROJECT_TYPE_META.mod).icon}
                {(PROJECT_TYPE_META[hit.project_type] ?? PROJECT_TYPE_META.mod).label}
              </span>
            </div>

            <p style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              fontWeight: 400,
            }}>
              by <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{hit.author}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          marginTop: '12px',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {hit.description}
        </p>

        {/* Loaders */}
        {hit.display_categories?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '12px' }}>
            {hit.display_categories.slice(0, 5).map(cat => (
              <span key={cat} style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                padding: '2px 8px',
                borderRadius: '20px',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Loaders row */}
        {hit.versions?.length > 0 && (
          <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
            {[...new Set(hit.categories?.filter(c => {
              if (hit.project_type === 'plugin') {
                return ['paper', 'spigot', 'bukkit', 'folia', 'purpur', 'sponge', 'velocity', 'waterfall', 'bungeecord', 'geyser', 'geyser_plugin'].includes(c);
              }
              return ['fabric', 'forge', 'quilt', 'neoforge', 'babric', 'liteloader', 'rift', 'modloader', 'risugami'].includes(c);
            }))].slice(0, 4).map(loader => {
              const color = LOADER_COLORS[loader] ?? '#64748b';
              return (
                <span key={loader} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  color,
                  background: `${color}15`,
                  border: `1px solid ${color}35`,
                  padding: '3px 8px 3px 5px',
                  borderRadius: '6px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  fontFamily: 'DM Mono, monospace',
                }}>
                  {getLoaderIcon(loader, 12)}
                  {loader}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '14px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', gap: '14px' }}>
            <Stat icon={<Download size={12} />} value={formatDownloads(hit.downloads)} />
            <Stat icon={<Heart size={12} />} value={formatDownloads(hit.follows)} />
            <Stat icon={<Clock size={12} />} value={formatDate(hit.date_modified)} />
          </div>
          <ExternalLink size={13} color="var(--text-muted)" />
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '12px',
      color: 'var(--text-muted)',
      fontWeight: 500,
    }}>
      {icon}{value}
    </span>
  );
}
