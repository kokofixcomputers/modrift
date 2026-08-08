import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Clock, ExternalLink, Globe, Tag, Users, Link2, Copy, Check, Wifi, Layers, TrendingUp, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MarkdownBody } from './MarkdownBody';
import { ModrinthInstallButton } from './ModrinthInstallButton';
import type { ServerHit } from './ServersView';
import type { SearchHit } from '../types/modrinth';
import { formatDate, numToHex } from '../api/modrinth';
import { ModDetail } from './ModDetail';
import axios from 'axios';

const v2 = axios.create({
  baseURL: 'https://api.modrinth.com/v2',
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

const v3 = axios.create({
  baseURL: 'https://api.modrinth.com/v3',
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

interface PingData {
  version_name: string;
  players_online: number;
  players_max: number;
  description: string;
}

interface ServerContent {
  kind: string;
  project_id: string;
  project_name: string;
  project_icon: string;
}

interface V3Project {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  icon_url: string | null;
  color: number | null;
  status: string;
  categories: string[];
  additional_categories: string[];
  link_urls: Record<string, { platform: string; donation: boolean; url: string }>;
  minecraft_java_server: {
    address: string;
    content: ServerContent | null;
    ping: { data: PingData } | null;
    verified_plays_2w: number;
    verified_plays_4w: number;
  } | null;
}

interface ServerDetailProps {
  server: ServerHit;
  onClose: () => void;
}

function formatNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '10px' }}>
      {icon}
      <span style={{
        fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em',
        textTransform: 'uppercase', fontFamily: 'DM Mono, monospace',
      }}>
        {label}
      </span>
    </div>
  );
}

export function ServerDetail({ server, onClose }: ServerDetailProps) {
  const [full, setFull] = useState<V3Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [modpackImgError, setModpackImgError] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [modpackHit, setModpackHit] = useState<SearchHit | null>(null);
  const [modpackSlug, setModpackSlug] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(() => localStorage.getItem('detail-fullscreen') === 'true');
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const { lang, translate, forceTranslate } = useLanguage();

  const accent = numToHex(server.color);

  useEffect(() => {
    setLoading(true);
    setFull(null);
    setModpackSlug(null);
    setTranslatedDesc(null);
    setTranslatedBody(null);
    v3.get(`/project/${server.slug}`)
      .then(r => {
        setFull(r.data);
        const contentId = r.data.minecraft_java_server?.content?.project_id;
        if (contentId) {
          v2.get(`/project/${contentId}`)
            .then(mp => setModpackSlug(mp.data.slug))
            .catch(() => {});
        }
      })
      .catch(() => setFull(null))
      .finally(() => setLoading(false));
  }, [server.slug]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    setTranslatedDesc(null);
    setTranslatedBody(null);
    if (lang === 'en') return;
    let cancelled = false;
    setTranslating(true);
    const bodyText = full?.description ?? '';
    const tasks = [
      translate(server.description).then(t => { if (!cancelled) setTranslatedDesc(t); }),
      bodyText.trim() ? translate(bodyText).then(t => { if (!cancelled) setTranslatedBody(t); }) : Promise.resolve(),
    ];
    Promise.all(tasks).finally(() => { if (!cancelled) setTranslating(false); });
    return () => { cancelled = true; };
  }, [lang, server.slug, full?.description]);

  const handleForceTranslate = async () => {
    setTranslating(true);
    const target = lang;
    const bodyText = full?.description ?? '';
    const tasks = [
      forceTranslate(server.description, target).then(t => setTranslatedDesc(t)),
      bodyText.trim() ? forceTranslate(bodyText, target).then(t => setTranslatedBody(t)) : Promise.resolve(),
    ];
    await Promise.all(tasks);
    setTranslating(false);
  };

  const translateBtn = !translating && !translatedDesc && (
    <button
      onClick={handleForceTranslate}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        marginTop: '10px', padding: '5px 10px',
        background: 'none', border: '1px solid var(--border)',
        borderRadius: '8px', cursor: 'pointer', fontSize: '12px',
        color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = '#0ea5e9';
        (e.currentTarget as HTMLElement).style.color = '#0ea5e9';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
      }}
    >
      <Globe size={11} />
      Translate
    </button>
  );

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  const openModpack = (projectId: string) => {
    v2.get(`/project/${projectId}`).then(r => {
      const p = r.data;
      const hit: SearchHit = {
        slug: p.slug,
        title: p.title,
        description: p.description,
        categories: p.categories ?? [],
        client_side: p.client_side ?? 'unknown',
        server_side: p.server_side ?? 'unknown',
        project_type: p.project_type ?? 'modpack',
        downloads: p.downloads ?? 0,
        follows: p.followers ?? 0,
        icon_url: p.icon_url ?? null,
        project_id: p.id,
        author: '',
        display_categories: p.categories ?? [],
        versions: p.game_versions ?? [],
        date_created: p.published ?? '',
        date_modified: p.updated ?? '',
        latest_version: null,
        license: p.license?.id ?? '',
        gallery: [],
        featured_gallery: null,
        color: p.color ?? null,
      };
      setModpackSlug(p.slug);
      setModpackHit(hit);
    }).catch(() => {});
  };

  const javaServer = full?.minecraft_java_server;
  const pingData = javaServer?.ping?.data ?? null;
  const isOnline = pingData !== null;
  const content = javaServer?.content ?? null;

  const linkEntries = Object.entries(full?.link_urls ?? {}).filter(([, v]) => v.url);

  const allCategories = [
    ...(server.display_categories ?? []),
    ...(full?.additional_categories ?? []),
  ].filter((c, i, a) => a.indexOf(c) === i);

  // ─── Section JSX variables ────────────────────────────────────────────────

  const statsSection = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: javaServer?.verified_plays_2w ? '1fr 1fr 1fr' : '1fr 1fr',
      gap: '10px', marginBottom: '22px',
    }}>
      {[
        { icon: <Users size={14} />, label: 'Followers', value: formatNum(server.follows) },
        { icon: <Clock size={14} />, label: 'Updated', value: formatDate(server.date_modified) },
        ...(javaServer?.verified_plays_2w ? [{ icon: <TrendingUp size={14} />, label: 'Plays (2w)', value: formatNum(javaServer.verified_plays_2w) }] : []),
      ].map(stat => (
        <div key={stat.label} style={{
          background: 'var(--off-white)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px', textAlign: 'center',
        }}>
          <div style={{ color: accent, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{stat.value}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );

  const addressSection = loading ? (
    <div style={{ height: '62px', background: 'var(--border)', borderRadius: '14px', marginBottom: '22px' }} className="shimmer" />
  ) : javaServer?.address ? (
    <div style={{
      background: isOnline ? 'rgba(27,202,142,0.04)' : 'var(--off-white)',
      border: `1px solid ${isOnline ? 'rgba(27,202,142,0.2)' : 'var(--border)'}`,
      borderRadius: '14px', padding: '14px 16px', marginBottom: '22px',
    }}>
      <SectionTitle icon={<Wifi size={13} />} label="Server Address" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {javaServer.address}
          </span>
          <button
            onClick={() => handleCopy(javaServer.address, 'ip')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: '3px', color: copied === 'ip' ? '#1bca8e' : 'var(--text-muted)', transition: 'color 0.15s' }}
            title="Copy address"
          >
            {copied === 'ip' ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        {isOnline && pingData && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>
              {pingData.players_online}/{pingData.players_max} players
            </span>
            {pingData.version_name && (
              <span style={{
                fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace',
                overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px', whiteSpace: 'nowrap',
              }}>
                {pingData.version_name}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  ) : null;

  const modpackSection = content ? (
    <div style={{ marginBottom: '22px' }}>
      <SectionTitle icon={<Layers size={13} />} label="Required Modpack" />
      <div
        onClick={() => openModpack(content.project_id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px',
          background: 'rgba(14,165,233,0.04)',
          border: '1px solid rgba(14,165,233,0.18)',
          borderRadius: '12px', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.08)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.04)'; }}
      >
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden',
          background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {content.project_icon && !modpackImgError ? (
            <img src={content.project_icon} alt={content.project_name} onError={() => setModpackImgError(true)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Layers size={18} color="#0ea5e9" />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif', marginBottom: '2px' }}>
            {content.project_name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', textTransform: 'capitalize' }}>
            {content.kind}
          </div>
        </div>
        <ExternalLink size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </div>
      {modpackSlug && (
        <ModrinthInstallButton
          href={`modrinth://modpack/${modpackSlug}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            marginTop: '8px', padding: '10px', width: '100%',
            background: 'linear-gradient(135deg, #1bca8e, #0ea5e9)',
            color: 'white', borderRadius: '10px', border: 'none',
            fontSize: '13px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
            boxShadow: '0 2px 12px rgba(27,202,142,0.35)',
            transition: 'all 0.15s ease', cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.08)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = '';
            e.currentTarget.style.transform = '';
          }}
        />
      )}
    </div>
  ) : null;

  const categoriesSection = allCategories.length > 0 ? (
    <div style={{ marginBottom: '22px' }}>
      <SectionTitle icon={<Tag size={13} />} label="Categories" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {allCategories.map(cat => (
          <span key={cat} style={{
            fontSize: '12px', color: '#0ea5e9', background: 'rgba(14,165,233,0.1)',
            border: '1px solid rgba(14,165,233,0.2)', padding: '4px 10px',
            borderRadius: '20px', fontWeight: 500, textTransform: 'capitalize',
          }}>
            {cat}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const linksSection = linkEntries.length > 0 ? (
    <div style={{ marginBottom: '22px' }}>
      <SectionTitle icon={<Link2 size={13} />} label="Links" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {linkEntries.map(([key, link]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px',
            background: 'var(--off-white)', border: '1px solid var(--border)',
            borderRadius: '10px',
          }}>
            <Globe size={13} color="var(--text-muted)" />
            <span style={{
              fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em',
              textTransform: 'capitalize', color: 'var(--text-muted)',
              fontFamily: 'DM Mono, monospace', flexShrink: 0, minWidth: '52px',
            }}>
              {key}
            </span>
            <a
              href={link.url} target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, fontSize: '12px', color: '#0ea5e9', textDecoration: 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                fontFamily: 'DM Mono, monospace',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.textDecoration = 'underline'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.textDecoration = 'none'}
            >
              {link.url.replace(/^https?:\/\//, '')}
            </a>
            <button
              onClick={() => handleCopy(link.url, key)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', padding: '2px', flexShrink: 0,
                color: copied === key ? '#1bca8e' : 'var(--text-muted)',
                transition: 'color 0.15s',
              }}
              title="Copy URL"
            >
              {copied === key ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  // ─── Header ───────────────────────────────────────────────────────────────

  const header = (
    <div style={{
      position: 'sticky', top: 0,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: '14px',
      zIndex: 10, flexShrink: 0,
    }}>
      {/* Accent strip is part of the panel, so header has no top radius */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
        background: `linear-gradient(135deg, ${accent}22, ${accent}08)`,
        border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {server.icon_url && !imgError ? (
          <img src={server.icon_url} alt={server.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Wifi size={22} color={accent} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 800,
          color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {server.title}
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
          {loading ? (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>Checking...</span>
          ) : isOnline ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600, color: '#1bca8e',
              background: 'rgba(27,202,142,0.1)', border: '1px solid rgba(27,202,142,0.25)',
              padding: '1px 8px', borderRadius: '20px', fontFamily: 'DM Mono, monospace',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1bca8e', display: 'inline-block' }} />
              Online · {formatNum(pingData!.players_online)}/{formatNum(pingData!.players_max)} players
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600, color: '#ef4444',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
              padding: '1px 8px', borderRadius: '20px', fontFamily: 'DM Mono, monospace',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Offline
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={() => setFullscreen(f => { const next = !f; localStorage.setItem('detail-fullscreen', String(next)); return next; })}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
        >
          {fullscreen ? <Minimize2 size={13} color="var(--text-secondary)" /> : <Maximize2 size={13} color="var(--text-secondary)" />}
        </button>
        <button
          onClick={onClose}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface)'}
        >
          <X size={14} color="var(--text-secondary)" />
        </button>
      </div>
    </div>
  );

  const footer = (
    <div style={{ padding: '16px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: '10px', flexShrink: 0 }}>
      <a
        href={`https://modrinth.com/server/${server.slug}`}
        target="_blank" rel="noopener noreferrer"
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          padding: '10px', borderRadius: '10px', border: '1px solid var(--border-strong)',
          fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
          (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
        }}
      >
        <ExternalLink size={13} /> View on Modrinth
      </a>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)',
          zIndex: 100, display: 'flex',
          alignItems: fullscreen ? 'stretch' : 'flex-start',
          justifyContent: fullscreen ? 'stretch' : 'flex-end',
          padding: fullscreen ? '0' : '16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: fullscreen ? 0 : 60, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: fullscreen ? 0 : 60, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={e => e.stopPropagation()}
          layout
          style={{
            width: '100%', maxWidth: fullscreen ? '100%' : '480px',
            height: fullscreen ? '100vh' : 'calc(100vh - 32px)',
            overflowY: fullscreen ? 'hidden' : 'auto',
            background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(24px)',
            borderRadius: fullscreen ? '0' : '22px',
            border: '1px solid rgba(255,255,255,1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.16), 0 8px 24px rgba(0,0,0,0.08)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Accent strip */}
          <div style={{
            height: '4px', borderRadius: fullscreen ? '0' : '22px 22px 0 0',
            background: `linear-gradient(90deg, ${accent}, ${accent}40)`,
            flexShrink: 0,
          }} />

          {header}

          {fullscreen ? (
            // ── Two-column fullscreen layout ──────────────────────────────
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: description + full markdown about */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '28px 36px',
                borderRight: '1px solid var(--border)',
              }}>
                <div style={{ maxWidth: '720px' }}>
                  <div style={{
                    fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75,
                    marginBottom: '28px',
                    padding: '16px 20px',
                    background: 'var(--off-white)', border: '1px solid var(--border)',
                    borderRadius: '12px',
                  }}>
                    {translating && !translatedDesc ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '13px' }}>Translating…</span>
                      </div>
                    ) : (
                      <p style={{ margin: 0 }}>{translatedDesc ?? server.description}</p>
                    )}
                    {translateBtn}
                  </div>
                  {!loading && full?.description && full.description.trim() ? (
                    <>
                      <h3 style={{
                        fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700,
                        color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase',
                        marginBottom: '16px',
                      }}>
                        About
                      </h3>
                      {translating && !translatedBody ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', padding: '8px 0' }}>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          <span style={{ fontSize: '13px' }}>Translating…</span>
                        </div>
                      ) : (
                        <MarkdownBody content={translatedBody ?? full.description} accent="#0ea5e9" />
                      )}
                    </>
                  ) : null}
                </div>
              </div>

              {/* Right: stats + address + modpack + categories + links */}
              <div style={{
                width: '400px', flexShrink: 0, overflowY: 'auto', padding: '22px',
                background: 'rgba(248,250,252,0.8)',
              }}>
                {statsSection}
                {addressSection}
                {modpackSection}
                {categoriesSection}
                {linksSection}
              </div>
            </div>
          ) : (
            // ── Single-column normal layout ───────────────────────────────
            <div style={{ padding: '22px', flex: 1 }}>
              {statsSection}
              {addressSection}

              {/* Short description */}
              <div style={{
                background: 'var(--off-white)', border: '1px solid var(--border)',
                borderRadius: '14px', padding: '16px', marginBottom: '22px',
              }}>
                {translating && !translatedDesc ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    <span style={{ fontSize: '13px' }}>Translating…</span>
                  </div>
                ) : (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {translatedDesc ?? server.description}
                  </p>
                )}
                {translateBtn}
              </div>

              {/* Full about / markdown */}
              {!loading && full?.description && full.description.trim() ? (
                <div style={{
                  background: 'white', border: '1px solid var(--border)',
                  borderRadius: '14px', padding: '16px', marginBottom: '22px',
                }}>
                  <SectionTitle icon={<Globe size={13} />} label="About" />
                  <div style={{ marginTop: '10px' }}>
                    {translating && !translatedBody ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', padding: '8px 0' }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '13px' }}>Translating…</span>
                      </div>
                    ) : (
                      <MarkdownBody content={translatedBody ?? full.description} accent="#0ea5e9" />
                    )}
                  </div>
                </div>
              ) : null}

              {modpackSection}
              {categoriesSection}
              {linksSection}
            </div>
          )}

          {footer}
        </motion.div>
      </motion.div>

      {/* Modpack detail — opens on top when required modpack is clicked */}
      <AnimatePresence>
        {modpackHit && (
          <ModDetail hit={modpackHit} onClose={() => setModpackHit(null)} />
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}
