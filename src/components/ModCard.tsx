import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Heart, Clock, Package, Layers, Plug, Zap, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SearchHit } from '../types/modrinth';
import { formatDownloads, formatDate, numToHex } from '../api/modrinth';
import { getLoaderIcon, LOADER_COLORS } from './LoaderIcons';

interface ModCardProps {
  hit: SearchHit;
  index: number;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  mod:          <Package size={10} />,
  modpack:      <Layers size={10} />,
  resourcepack: <Image size={10} />,
  shader:       <Zap size={10} />,
  plugin:       <Plug size={10} />,
};
const TYPE_LABEL: Record<string, string> = {
  mod: 'Mod', modpack: 'Modpack', resourcepack: 'Resource Pack',
  shader: 'Shader', plugin: 'Plugin',
};

const MOD_LOADERS = new Set(['fabric','forge','quilt','neoforge','babric','liteloader','rift','modloader','risugami']);
const PLUGIN_LOADERS = new Set(['paper','spigot','bukkit','folia','purpur','sponge','velocity','waterfall','bungeecord','geyser','geyser_plugin']);

function envLabel(c: string, s: string): string | null {
  const cOk = c === 'required' || c === 'optional';
  const sOk = s === 'required' || s === 'optional';
  if (!cOk && !sOk) return null;
  if (cOk && !sOk) return c === 'optional' ? 'Client (optional)' : 'Client';
  if (!cOk && sOk) return s === 'optional' ? 'Server (optional)' : 'Server';
  // both sides supported
  if (c === 'required' && s === 'required') return 'Client & Server';
  if (c === 'required' && s === 'optional') return 'Client + Server';
  if (c === 'optional' && s === 'required') return 'Server + Client';
  return 'Client & Server';
}

export function ModCard({ hit, index }: ModCardProps) {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const accentHex = numToHex(hit.color) || 'var(--accent)';

  const loaders = [...new Set(hit.categories?.filter(c =>
    hit.project_type === 'plugin' ? PLUGIN_LOADERS.has(c) : MOD_LOADERS.has(c)
  ))].slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.035, ease: [0.4, 0, 0.2, 1] }}
      onClick={() => navigate(`/mod/${hit.slug}`)}
      className="glass-card"
      style={{
        cursor: 'pointer',
        borderRadius: '14px',
        overflow: 'hidden',
        position: 'relative',
        transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
      }}
      whileHover={{ scale: 1.005 }}
    >
      {/* Accent top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, ${accentHex}70, transparent)`,
      }} />

      <div style={{ padding: '16px', paddingTop: '18px' }}>
        {/* Header row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
          {/* Icon */}
          <div style={{
            width: '46px', height: '46px', borderRadius: '11px',
            overflow: 'hidden', flexShrink: 0,
            background: `linear-gradient(135deg, ${accentHex}20, ${accentHex}08)`,
            border: `1px solid ${accentHex}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {hit.icon_url && !imgError ? (
              <img src={hit.icon_url} alt={hit.title} onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Package size={20} color={accentHex} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <h3 style={{
                fontSize: '14px', fontWeight: 600,
                color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
              }}>
                {hit.title}
              </h3>
              <span style={{
                fontSize: '10px', color: accentHex,
                background: `${accentHex}14`, border: `1px solid ${accentHex}28`,
                padding: '2px 6px', borderRadius: '20px', fontWeight: 600,
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '3px',
                fontFamily: 'JetBrains Mono, monospace',
              }}>
                {TYPE_ICON[hit.project_type] ?? TYPE_ICON.mod}
                {TYPE_LABEL[hit.project_type] ?? 'Mod'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif' }}>
              by <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{hit.author}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          marginBottom: '10px',
        }}>
          {hit.description}
        </p>

        {/* Categories */}
        {hit.display_categories?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
            {hit.display_categories.slice(0, 4).map(cat => (
              <span key={cat} style={{
                fontSize: '10px', color: 'var(--text-3)',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                padding: '2px 7px', borderRadius: '20px', fontWeight: 500, textTransform: 'capitalize',
              }}>
                {cat}
              </span>
            ))}
          </div>
        )}

        {/* Loaders */}
        {loaders.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {loaders.map(loader => {
              const color = LOADER_COLORS[loader] ?? '#64748b';
              return (
                <span key={loader} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  fontSize: '10px', color, background: `${color}16`,
                  border: `1px solid ${color}30`, padding: '2px 7px 2px 5px',
                  borderRadius: '5px', fontWeight: 600, textTransform: 'capitalize',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {getLoaderIcon(loader, 11)}{loader}
                </span>
              );
            })}
          </div>
        )}

        {/* Stats footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Stat icon={<Download size={11} />} value={formatDownloads(hit.downloads)} />
            <Stat icon={<Heart size={11} />} value={formatDownloads(hit.follows)} />
            <Stat icon={<Clock size={11} />} value={formatDate(hit.date_modified)} />
          </div>
          {envLabel(hit.client_side, hit.server_side) && (
            <span style={{
              fontSize: '10px', color: 'var(--text-3)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              padding: '2px 7px', borderRadius: '20px', fontWeight: 500,
              fontFamily: 'JetBrains Mono, monospace', flexShrink: 0,
            }}>
              {envLabel(hit.client_side, hit.server_side)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', color: 'var(--text-3)', fontWeight: 500,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {icon}{value}
    </span>
  );
}
