import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, Heart, Clock, Package, ExternalLink, ChevronDown,
  CheckCircle, Tag, Calendar, AlertTriangle, Images, Loader2, Globe, Search,
  Bug, Code2, BookOpen, MessageCircle, Link as LinkIcon,
  Crown, Users, Building2, Archive, GitCompare, Plus, Minus, RefreshCw,
  CreditCard, Radio, Bot, Monitor,
} from 'lucide-react';
import { unzip } from 'fflate';
import type { SearchHit, Version, Dependency } from '../types/modrinth';
import type { CFFile } from '../types/curseforge';
import { getProjectVersions, formatDownloads, formatDate, numToHex } from '../api/modrinth';
import { cfGetFiles } from '../api/curseforge';
import { Dropdown } from './Dropdown';
import { getLoaderIcon } from './LoaderIcons';
import { MarkdownBody } from './MarkdownBody';
import { ModrinthInstallButton } from './ModrinthInstallButton';
import { parseYouTubeParts, YouTubeEmbed } from './YouTubeEmbed';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

export interface CFDetailData {
  files: CFFile[];
  descriptionHtml: string | null;
  links: { website: string | null; issues: string | null; source: string | null; wiki: string | null };
  authors: { id: number; name: string; url: string }[];
  modId: number;
  slug: string;
  classId: number;
  screenshots: { url: string; title: string; description: string }[];
  cfDeps?: { modId: number; name: string; slug: string; logoUrl: string | null; relationType: number; classId: number }[];
}

const modrinthV2 = axios.create({
  baseURL: 'https://api.modrinth.com/v2',
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

export interface ModDetailProps {
  hit: SearchHit;
  onClose: () => void;
  contextType?: string;
  mode?: 'modal' | 'page';
  cfData?: CFDetailData;
}

const CF_ORANGE = '#f16436';
const CF_KNOWN_LOADERS = new Set(['fabric', 'forge', 'neoforge', 'quilt', 'liteloader', 'cauldron', 'modloader']);

function cfFileLoaders(file: CFFile): string[] {
  return file.gameVersions.filter(v => CF_KNOWN_LOADERS.has(v.toLowerCase()));
}
function cfFileMcVersions(file: CFFile): string[] {
  return file.gameVersions.filter(v => /^\d+\.\d+/.test(v));
}
function cfReleaseTypeName(rt: 1 | 2 | 3): string {
  return rt === 1 ? 'release' : rt === 2 ? 'beta' : 'alpha';
}
function sanitizeCfHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    // Strip non-YouTube iframes; YouTube ones are rendered as YouTubeEmbed
    .replace(/<iframe(?![^>]*src=["']https?:\/\/(?:www\.)?(?:youtube(?:-nocookie)?\.com)\/)[^>]*(?:>\s*<\/iframe>|\/?>)/gi, '')
    .replace(/<iframe[^>]*(?:>\s*<\/iframe>|\/?>)/gi, '');
}
function cfModClassPath(classId: number): string {
  const map: Record<number, string> = {
    6: 'mc-mods', 4471: 'modpacks', 12: 'texture-packs', 6552: 'shaders', 5: 'bukkit-plugins',
  };
  return map[classId] ?? 'mc-mods';
}

// ── Disclosure types ─────────────────────────────────────────────────────────
type Disclosure =
  | { type: 'paid_features'; features: string[]; updated_at: string }
  | { type: 'telemetry'; consent: string; data_collected: string[]; updated_at: string }
  | { type: 'ai_content'; note: string | null; uses: string[]; updated_at: string }
  | { type: 'system_interactions'; note: string | null; interactions: string[]; updated_at: string };
// ─────────────────────────────────────────────────────────────────────────────

// ── Modpack compare helpers ───────────────────────────────────────────────────
const MODRINTH_CDN_RE = /\/data\/([A-Za-z0-9]+)\/versions\/([A-Za-z0-9]+)\//;

interface MrpackEntry { projectId: string; versionId: string; }
interface CmpMod { projectId: string; name: string; iconUrl: string | null; versionId: string; }
interface CompareResult {
  added: CmpMod[];
  removed: CmpMod[];
  updated: (CmpMod & { fromVersion: string; toVersion: string })[];
}

async function parseMrpackEntries(url: string): Promise<MrpackEntry[]> {
  const resp = await fetch(url);
  const buf = new Uint8Array(await resp.arrayBuffer());
  return new Promise((resolve, reject) => {
    unzip(buf, (err, files) => {
      if (err) { reject(err); return; }
      const bytes = files['modrinth.index.json'];
      if (!bytes) { resolve([]); return; }
      const index = JSON.parse(new TextDecoder().decode(bytes)) as { files: { path: string; downloads: string[] }[] };
      const entries: MrpackEntry[] = [];
      for (const f of index.files) {
        if (!f.path.startsWith('mods/')) continue;
        for (const dl of f.downloads) {
          const m = dl.match(MODRINTH_CDN_RE);
          if (m) { entries.push({ projectId: m[1], versionId: m[2] }); break; }
        }
      }
      resolve(entries);
    });
  });
}
// ─────────────────────────────────────────────────────────────────────────────

const VERSION_TYPE_COLOR: Record<string, string> = {
  release: '#1bca8e',
  beta: '#f59e0b',
  alpha: '#f43f5e',
};

const label: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em',
  textTransform: 'uppercase', color: 'var(--text-3)',
  fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px',
};

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
      <span style={{ color: 'var(--text-3)' }}>{icon}</span>
      <span style={{ ...label, marginBottom: 0 }}>{children}</span>
    </div>
  );
}

interface DepInfo {
  dep: Dependency;
  project: { id: string; slug: string; title: string; icon_url: string | null; project_type: string };
}

interface TeamMember {
  user: { id: string; username: string; avatar_url: string | null; bio: string | null };
  role: string;
  accepted: boolean;
  ordering: number;
}

interface DevProject {
  id: string; slug: string; title: string; icon_url: string | null;
  project_type: string; downloads: number; follows: number;
  status: string; date_modified: string;
}

function DepCard({ info }: { info: DepInfo }) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const typeColor = info.dep.dependency_type === 'required' ? 'var(--red)' : 'var(--amber)';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const r = await modrinthV2.get(`/project/${info.project.slug}/version`, {
        params: { limit: 1, version_type: 'release' },
      });
      const primaryFile = r.data[0]?.files?.find((f: { primary: boolean }) => f.primary) ?? r.data[0]?.files?.[0];
      if (primaryFile?.url) {
        const a = document.createElement('a');
        a.href = primaryFile.url; a.download = primaryFile.filename; a.click();
      }
    } finally { setDownloading(false); }
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '10px 12px',
      background: 'var(--card)', border: '1px solid var(--card-border)',
      borderRadius: '10px',
    }}>
      <div style={{
        width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
        overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--card-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {info.project.icon_url && !imgErr
          ? <img src={info.project.icon_url} alt={info.project.title} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={13} color="var(--text-3)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {info.project.title}
        </div>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: typeColor, fontFamily: 'JetBrains Mono, monospace' }}>
          {info.dep.dependency_type}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <IconBtn title="View mod" onClick={() => navigate(`/mod/${info.project.slug}`)}>
          <ExternalLink size={12} color="var(--text-3)" />
        </IconBtn>
        <IconBtn title="Download latest" onClick={handleDownload} disabled={downloading}>
          {downloading
            ? <Loader2 size={12} color="var(--text-3)" style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Download size={12} color="var(--accent)" />}
        </IconBtn>
      </div>
    </div>
  );
}

function CFDepCard({ dep, accentColor }: {
  dep: { modId: number; name: string; slug: string; logoUrl: string | null; relationType: number; classId: number };
  accentColor: string;
}) {
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [imgErr, setImgErr] = useState(false);
  const typeColor = dep.relationType === 3 ? 'var(--red)' : 'var(--amber)';
  const relLabel = dep.relationType === 3 ? 'required' : 'optional';

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const files = await cfGetFiles(String(dep.modId));
      // Pick best: prefer release (1) over beta (2) over alpha (3), then most recent
      const sorted = files
        .filter(f => f.downloadUrl)
        .sort((a, b) => a.releaseType !== b.releaseType ? a.releaseType - b.releaseType : new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime());
      const best = sorted[0];
      if (best?.downloadUrl) {
        const a = document.createElement('a'); a.href = best.downloadUrl; a.download = best.fileName; a.click();
      }
    } finally { setDownloading(false); }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '10px' }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0, overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {dep.logoUrl && !imgErr
          ? <img src={dep.logoUrl} alt={dep.name} onError={() => setImgErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={13} color="var(--text-3)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.name}</div>
        <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: typeColor, fontFamily: 'JetBrains Mono, monospace' }}>{relLabel}</span>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <IconBtn title="View mod" onClick={() => navigate(`/cf/${dep.modId}`)}>
          <ExternalLink size={12} color="var(--text-3)" />
        </IconBtn>
        <IconBtn title="Download latest" onClick={handleDownload} disabled={downloading}>
          {downloading
            ? <Loader2 size={12} color="var(--text-3)" style={{ animation: 'spin 0.8s linear infinite' }} />
            : <Download size={12} color={accentColor} />}
        </IconBtn>
      </div>
    </div>
  );
}

function IconBtn({ onClick, disabled, title, children }: {
  onClick: () => void; disabled?: boolean; title?: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick} disabled={disabled} title={title}
      style={{
        width: '26px', height: '26px', borderRadius: '7px',
        background: 'var(--card)', border: '1px solid var(--card-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer', transition: 'all 0.14s',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
    >
      {children}
    </button>
  );
}

function DevProjectCard({ p, onClose }: { p: DevProject; onClose: () => void }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  const archived = p.status === 'archived';
  return (
    <button
      onClick={() => { onClose(); navigate(`/mod/${p.slug}`); }}
      style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', borderRadius: '10px', background: 'var(--card)', border: '1px solid var(--card-border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.13s', width: '100%', opacity: archived ? 0.7 : 1 }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
    >
      <div style={{ width: '32px', height: '32px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-2)', border: '1px solid var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {p.icon_url && !err
          ? <img src={p.icon_url} alt={p.title} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={14} color="var(--text-3)" />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
          {archived && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--text-3)', background: 'var(--bg-2)', border: '1px solid var(--card-border)', padding: '1px 6px', borderRadius: '4px', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
              <Archive size={9} /> archived
            </span>
          )}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', marginTop: '2px' }}>
          {formatDownloads(p.downloads)} dl · <span style={{ textTransform: 'capitalize' }}>{p.project_type}</span>
        </div>
      </div>
    </button>
  );
}

function CmpSection({ title, icon, accent, count, children }: { title: string; icon: React.ReactNode; accent: string; count: number; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        {icon}
        <span style={{ fontSize: '12px', fontWeight: 700, color: accent, fontFamily: 'Instrument Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '1px 7px', borderRadius: '20px', background: `${accent}20`, color: accent, fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>{children}</div>
    </div>
  );
}

function CmpModRow({
  mod, accent, badge, versionId, expanded, onToggle, changelog,
}: {
  mod: CmpMod; accent: string; badge?: React.ReactNode;
  versionId: string; expanded: boolean;
  onToggle: () => void;
  changelog: string | null | 'loading' | undefined;
}) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div style={{
      borderRadius: '9px', overflow: 'hidden',
      border: `1px solid ${expanded ? accent + '50' : 'var(--card-border)'}`,
      transition: 'border-color 0.14s',
    }}>
      {/* Header row */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 10px',
          background: expanded ? `${accent}0a` : 'var(--card)',
          cursor: 'pointer', userSelect: 'none',
          transition: 'background 0.14s',
        }}
        onMouseEnter={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
        onMouseLeave={e => { if (!expanded) (e.currentTarget as HTMLElement).style.background = 'var(--card)'; }}
      >
        {mod.iconUrl && !imgErr
          ? <img src={mod.iconUrl} width="24" height="24" alt="" onError={() => setImgErr(true)}
              style={{ borderRadius: '5px', objectFit: 'cover', flexShrink: 0 }} />
          : <div style={{ width: 24, height: 24, borderRadius: '5px', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={12} color="var(--text-3)" />
            </div>
        }
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {mod.name}
        </span>
        {badge}
        <ChevronDown size={13} color="var(--text-3)" style={{ flexShrink: 0, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
      </div>

      {/* Changelog panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '14px 14px 12px', borderTop: `1px solid ${accent}28`, background: `${accent}06` }}>
              {changelog === 'loading' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <Loader2 size={12} color="var(--text-3)" style={{ animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif' }}>Loading changelog…</span>
                </div>
              ) : changelog ? (
                <div style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.65 }}>
                  <MarkdownBody content={changelog} accent={accent} />
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif', fontStyle: 'italic' }}>No changelog provided for this version.</p>
              )}
              <a
                href={`https://modrinth.com/mod/${mod.projectId}/version/${versionId}`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '11px', color: accent, textDecoration: 'none', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600 }}
              >
                <ExternalLink size={10} />
                View version on Modrinth
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ModDetail({ hit, onClose, contextType, mode = 'modal', cfData }: ModDetailProps) {
  const navigate = useNavigate();
  const [versions, setVersions]       = useState<Version[]>([]);
  const [projectBody, setProjectBody] = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [imgError, setImgError]       = useState(false);
  const [deps, setDeps]               = useState<DepInfo[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [galleryMeta, setGalleryMeta] = useState<{ url: string; raw_url: string; title: string | null; description: string | null }[]>([]);
  const [projectLinks, setProjectLinks] = useState<{ issues: string | null; source: string | null; wiki: string | null; discord: string | null; donations: { id: string; platform: string; url: string }[] } | null>(null);
  const [hoveredScreenshot, setHoveredScreenshot] = useState<number | null>(null);

  const { lang, translate, forceTranslate } = useLanguage();
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);
  const [translating, setTranslating]       = useState(false);

  const [selectedMcVersion, setSelectedMcVersion] = useState('');
  const [selectedLoader, setSelectedLoader]       = useState('');
  const [showSnapshots, setShowSnapshots]         = useState(false);

  const [activeTab, setActiveTab]   = useState<'about' | 'screenshots' | 'versions' | 'compare'>('about');
  const [vTabMc, setVTabMc]         = useState('');
  const [vTabLoader, setVTabLoader] = useState('');
  const [vTabTypes, setVTabTypes]   = useState(['release', 'beta', 'alpha']);
  const [vTabSearch, setVTabSearch] = useState('');

  // Compare tab state
  const [cmpA, setCmpA]                   = useState('');
  const [cmpB, setCmpB]                   = useState('');
  const [cmpLoading, setCmpLoading]       = useState(false);
  const [cmpResult, setCmpResult]         = useState<CompareResult | null>(null);
  const [cmpError, setCmpError]           = useState(false);
  const [expandedCmpMod, setExpandedCmpMod] = useState<string | null>(null);
  const [cmpChangelogs, setCmpChangelogs]   = useState<Map<string, string | null | 'loading'>>(new Map());

  const [teamMembers, setTeamMembers]   = useState<TeamMember[]>([]);
  const [projectOrgId, setProjectOrgId] = useState<string | null>(null);
  const [orgInfo, setOrgInfo]           = useState<{ name: string; iconUrl: string | null } | null>(null);
  const [disclosures, setDisclosures]   = useState<Disclosure[]>([]);
  const [showAllDeps, setShowAllDeps]   = useState(false);

  // CF-specific state
  const [cfDlMcVersion, setCfDlMcVersion] = useState('');
  const [cfDlLoader, setCfDlLoader]       = useState('');

  const accentHex = cfData ? CF_ORANGE : (numToHex(hit.color) || '#1bca8e');
  const installType = (contextType && contextType !== 'all' && contextType !== 'server')
    ? contextType : hit.project_type;

  // Fetch versions + body + deps
  useEffect(() => {
    setLoading(true);
    setSelectedMcVersion(''); setSelectedLoader('');
    setCfDlMcVersion(''); setCfDlLoader('');
    setProjectBody(null); setTranslatedDesc(null); setTranslatedBody(null);
    setDeps([]); setGalleryMeta([]); setProjectLinks(null);
    setTeamMembers([]); setProjectOrgId(null); setOrgInfo(null); setDisclosures([]); setShowAllDeps(false);
    setActiveTab('about'); setExpandedVersion(null);
    setCmpA(''); setCmpB(''); setCmpResult(null); setCmpError(false); setCmpLoading(false);
    setExpandedCmpMod(null); setCmpChangelogs(new Map());

    if (cfData) {
      setGalleryMeta(cfData.screenshots.map(s => ({
        url: s.url, raw_url: s.url,
        title: s.title || null, description: s.description || null,
      })));
      setLoading(false);
      return;
    }

    Promise.all([
      getProjectVersions(hit.slug),
      modrinthV2.get(`/project/${hit.slug}`).then(r => ({
        body: r.data.body as string | null,
        gallery: (r.data.gallery ?? []) as { url: string; raw_url: string; title: string | null; description: string | null }[],
        links: { issues: r.data.issues_url ?? null, source: r.data.source_url ?? null, wiki: r.data.wiki_url ?? null, discord: r.data.discord_url ?? null, donations: r.data.donation_urls ?? [] },
        organization: (r.data.organization ?? null) as string | null,
      })).catch(() => ({ body: null, gallery: [], links: null, organization: null })),
      modrinthV2.get(`/project/${hit.slug}/members`).then(r => r.data as TeamMember[]).catch(() => [] as TeamMember[]),
    ]).then(([vers, { body, gallery: gMeta, links, organization }, members]) => {
      setVersions(vers);
      setProjectBody(body);
      setGalleryMeta(gMeta);
      setProjectLinks(links);
      setProjectOrgId(organization);
      setTeamMembers(members.filter(m => m.accepted));
      if (organization) {
        axios.get(`https://api.modrinth.com/v3/organization/${organization}`, {
          headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
        }).then(r => setOrgInfo({ name: r.data.name, iconUrl: r.data.icon_url ?? null })).catch(() => {});
      }
      axios.get(`https://api.modrinth.com/v3/project/${hit.slug}/disclosures`, {
        headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
      }).then(r => setDisclosures(r.data.disclosures ?? [])).catch(() => {});

      const seen = new Set<string>();
      const uniqueDeps: Dependency[] = [];
      for (const v of vers) {
        for (const d of v.dependencies) {
          if (!d.project_id || d.dependency_type === 'incompatible' || seen.has(d.project_id)) continue;
          seen.add(d.project_id);
          uniqueDeps.push(d);
        }
      }
      if (!uniqueDeps.length) return;

      const ids = encodeURIComponent(JSON.stringify(uniqueDeps.map(d => d.project_id)));
      modrinthV2.get(`/projects?ids=${ids}`).then(r => {
        const projects: DepInfo['project'][] = r.data;
        setDeps(uniqueDeps.map(dep => ({
          dep, project: projects.find(p => p.id === dep.project_id)!,
        })).filter(d => d.project));
      }).catch(() => {});
    }).catch(() => setVersions([])).finally(() => setLoading(false));
  }, [hit.slug]);

  // Auto-translate
  useEffect(() => {
    setTranslatedDesc(null); setTranslatedBody(null);
    if (lang === 'en') return;
    let cancelled = false;
    setTranslating(true);
    const tasks = [
      translate(hit.description).then(t => { if (!cancelled) setTranslatedDesc(t); }),
      projectBody ? translate(projectBody).then(t => { if (!cancelled) setTranslatedBody(t); }) : Promise.resolve(),
    ];
    Promise.all(tasks).finally(() => { if (!cancelled) setTranslating(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, hit.slug, projectBody]);

  const handleForceTranslate = async () => {
    setTranslating(true);
    const t = lang;
    await Promise.all([
      forceTranslate(hit.description, t).then(r => setTranslatedDesc(r)),
      projectBody ? forceTranslate(projectBody, t).then(r => setTranslatedBody(r)) : Promise.resolve(),
    ]);
    setTranslating(false);
  };

  // Escape to close (modal only)
  useEffect(() => {
    if (mode !== 'modal') return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, mode]);

  // Version filtering
  const availableMcVersions = useMemo(() => {
    const seen = new Set<string>(); const result: string[] = [];
    for (const v of versions) for (const gv of v.game_versions) { if (!seen.has(gv)) { seen.add(gv); result.push(gv); } }
    return result.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [versions]);

  const availableLoaders = useMemo(() => {
    const relevant = selectedMcVersion ? versions.filter(v => v.game_versions.includes(selectedMcVersion)) : versions;
    const seen = new Set<string>();
    for (const v of relevant) for (const l of v.loaders) seen.add(l);
    return [...seen].sort();
  }, [versions, selectedMcVersion]);

  useEffect(() => {
    if (selectedLoader && !availableLoaders.includes(selectedLoader)) setSelectedLoader('');
  }, [availableLoaders, selectedLoader]);

  // CF-specific derived values
  const allCfDlMcVersions = useMemo(() => {
    if (!cfData) return [];
    const seen = new Set<string>();
    for (const f of cfData.files) for (const v of cfFileMcVersions(f)) seen.add(v);
    return [...seen].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [cfData]);

  const allCfDlLoaders = useMemo(() => {
    if (!cfData) return [];
    const files = cfDlMcVersion ? cfData.files.filter(f => cfFileMcVersions(f).includes(cfDlMcVersion)) : cfData.files;
    const seen = new Set<string>();
    for (const f of files) for (const l of cfFileLoaders(f)) seen.add(l);
    return [...seen].sort();
  }, [cfData, cfDlMcVersion]);

  const matchedCFFile = useMemo(() => {
    if (!cfData || (!cfDlMcVersion && !cfDlLoader)) return null;
    const priority: Record<number, number> = { 1: 0, 2: 1, 3: 2 };
    return cfData.files.filter(f => {
      const mcOk = !cfDlMcVersion || cfFileMcVersions(f).includes(cfDlMcVersion);
      const loaderOk = !cfDlLoader || cfFileLoaders(f).some(l => l.toLowerCase() === cfDlLoader.toLowerCase());
      return mcOk && loaderOk;
    }).sort((a, b) => (priority[a.releaseType] ?? 3) - (priority[b.releaseType] ?? 3))[0] ?? null;
  }, [cfData, cfDlMcVersion, cfDlLoader]);

  const cfTabAllMcVersions = useMemo(() => {
    if (!cfData) return [];
    const seen = new Set<string>();
    for (const f of cfData.files) for (const v of cfFileMcVersions(f)) seen.add(v);
    return [...seen].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [cfData]);

  const cfTabAllLoaders = useMemo(() => {
    if (!cfData) return [];
    const files = vTabMc ? cfData.files.filter(f => cfFileMcVersions(f).includes(vTabMc)) : cfData.files;
    const seen = new Set<string>();
    for (const f of files) for (const l of cfFileLoaders(f)) seen.add(l);
    return [...seen].sort();
  }, [cfData, vTabMc]);

  const cfTabFilteredFiles = useMemo(() => {
    if (!cfData) return [];
    const q = vTabSearch.trim().toLowerCase();
    return cfData.files.filter(f => {
      const type = cfReleaseTypeName(f.releaseType);
      const mcOk     = !vTabMc     || cfFileMcVersions(f).includes(vTabMc);
      const loaderOk = !vTabLoader || cfFileLoaders(f).some(l => l.toLowerCase() === vTabLoader.toLowerCase());
      const typeOk   = vTabTypes.includes(type);
      const searchOk = !q || f.fileName.toLowerCase().includes(q) || f.displayName.toLowerCase().includes(q);
      return mcOk && loaderOk && typeOk && searchOk;
    });
  }, [cfData, vTabMc, vTabLoader, vTabTypes, vTabSearch]);

  const isRelease = (v: string) => /^\d+(\.\d+)*$/.test(v);
  const filteredMcVersions = showSnapshots ? availableMcVersions : availableMcVersions.filter(isRelease);
  const snapshotCount = availableMcVersions.length - availableMcVersions.filter(isRelease).length;

  useEffect(() => {
    if (selectedMcVersion && !filteredMcVersions.includes(selectedMcVersion)) setSelectedMcVersion('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSnapshots]);

  const matchedVersion = useMemo(() => {
    if (!selectedMcVersion && !selectedLoader) return null;
    const priority = { release: 0, beta: 1, alpha: 2 };
    return versions.filter(v => {
      const mcOk = !selectedMcVersion || v.game_versions.includes(selectedMcVersion);
      const loaderOk = !selectedLoader || v.loaders.includes(selectedLoader);
      return mcOk && loaderOk;
    }).sort((a, b) => {
      const pa = priority[a.version_type as keyof typeof priority] ?? 3;
      const pb = priority[b.version_type as keyof typeof priority] ?? 3;
      return pa !== pb ? pa - pb : new Date(b.date_published).getTime() - new Date(a.date_published).getTime();
    })[0] ?? null;
  }, [versions, selectedMcVersion, selectedLoader]);

  const tabFilteredVersions = useMemo(() => {
    const q = vTabSearch.trim().toLowerCase();
    return versions.filter(v => {
      const mcOk     = !vTabMc     || v.game_versions.includes(vTabMc);
      const loaderOk = !vTabLoader || v.loaders.includes(vTabLoader);
      const typeOk   = vTabTypes.includes(v.version_type);
      const searchOk = !q || v.version_number.toLowerCase().includes(q) || (v.name ?? '').toLowerCase().includes(q);
      return mcOk && loaderOk && typeOk && searchOk;
    });
  }, [versions, vTabMc, vTabLoader, vTabTypes, vTabSearch]);

  // Strip size suffix + extension to get the bare hash, for cross-format matching
  const imgHash = (url: string) => url.split('/').pop()?.replace(/_\d+/, '').replace(/\.[^.]+$/, '') ?? '';
  // Return the API's full-res URL if we have it, otherwise fall back to regex strip
  const fullRes = (url: string) => galleryMeta.find(g => imgHash(g.url) === imgHash(url))?.raw_url ?? url.replace(/_\d+(\.[^.]+)$/, '$1');

  const handleDownload = (file: Version['files'][number]) => {
    const a = document.createElement('a'); a.href = file.url; a.download = file.filename; a.click();
  };

  const gallery = cfData ? cfData.screenshots.map(s => s.url) : (hit.gallery ?? []);

  // ── Modpack compare ───────────────────────────────────────────────
  const runCompare = async () => {
    if (!cmpA || !cmpB || cmpA === cmpB) return;
    setCmpLoading(true);
    setCmpResult(null);
    setCmpError(false);
    try {
      const vA = versions.find(v => v.id === cmpA)!;
      const vB = versions.find(v => v.id === cmpB)!;
      const fA = vA.files.find(f => f.primary) ?? vA.files[0];
      const fB = vB.files.find(f => f.primary) ?? vB.files[0];

      const [entriesA, entriesB] = await Promise.all([
        parseMrpackEntries(fA.url),
        parseMrpackEntries(fB.url),
      ]);

      const mapA = new Map(entriesA.map(e => [e.projectId, e]));
      const mapB = new Map(entriesB.map(e => [e.projectId, e]));

      const addedIds   = [...mapB.keys()].filter(id => !mapA.has(id));
      const removedIds = [...mapA.keys()].filter(id => !mapB.has(id));
      const updatedIds = [...mapB.keys()].filter(
        id => mapA.has(id) && mapA.get(id)!.versionId !== mapB.get(id)!.versionId,
      );

      const allProjectIds = [...new Set([...addedIds, ...removedIds, ...updatedIds])];
      const allVersionIds = [...new Set([
        ...updatedIds.map(id => mapA.get(id)!.versionId),
        ...updatedIds.map(id => mapB.get(id)!.versionId),
      ])];

      const [projectsResp, versionsResp] = await Promise.all([
        allProjectIds.length
          ? modrinthV2.get(`/projects?ids=${encodeURIComponent(JSON.stringify(allProjectIds))}`)
          : Promise.resolve({ data: [] }),
        allVersionIds.length
          ? modrinthV2.get(`/versions?ids=${encodeURIComponent(JSON.stringify(allVersionIds))}`)
          : Promise.resolve({ data: [] }),
      ]);

      const projectMap = new Map<string, { name: string; iconUrl: string | null }>(
        (projectsResp.data as { id: string; title: string; icon_url: string | null }[])
          .map(p => [p.id, { name: p.title, iconUrl: p.icon_url }]),
      );
      const verNumMap = new Map<string, string>(
        (versionsResp.data as { id: string; version_number: string }[])
          .map(v => [v.id, v.version_number]),
      );

      const toMod = (id: string, versionId: string): CmpMod => {
        const info = projectMap.get(id);
        return { projectId: id, name: info?.name ?? id, iconUrl: info?.iconUrl ?? null, versionId };
      };

      setCmpResult({
        added:   addedIds.map(id => toMod(id, mapB.get(id)!.versionId)),
        removed: removedIds.map(id => toMod(id, mapA.get(id)!.versionId)),
        updated: updatedIds.map(id => ({
          ...toMod(id, mapB.get(id)!.versionId),
          fromVersion: verNumMap.get(mapA.get(id)!.versionId) ?? mapA.get(id)!.versionId.slice(0, 8),
          toVersion:   verNumMap.get(mapB.get(id)!.versionId) ?? mapB.get(id)!.versionId.slice(0, 8),
        })),
      });
    } catch {
      setCmpError(true);
    } finally {
      setCmpLoading(false);
    }
  };

  const toggleCmpMod = async (projectId: string, versionId: string) => {
    if (expandedCmpMod === projectId) { setExpandedCmpMod(null); return; }
    setExpandedCmpMod(projectId);
    if (!cmpChangelogs.has(projectId)) {
      setCmpChangelogs(m => new Map(m).set(projectId, 'loading'));
      try {
        const { data } = await modrinthV2.get(`/version/${versionId}`);
        setCmpChangelogs(m => new Map(m).set(projectId, (data.changelog as string | null) || null));
      } catch {
        setCmpChangelogs(m => new Map(m).set(projectId, null));
      }
    }
  };

  // ── JSX sections ──────────────────────────────────────────────────

  const translateBtn = !translating && !translatedDesc && (
    <button
      onClick={handleForceTranslate}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        marginTop: '12px', padding: '5px 10px',
        background: 'none', border: '1px solid var(--card-border)',
        borderRadius: '8px', cursor: 'pointer', fontSize: '11px',
        color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif', transition: 'all 0.15s',
      }}
      onMouseEnter={e => { (e.currentTarget).style.borderColor = 'var(--accent-border)'; (e.currentTarget).style.color = 'var(--accent)'; }}
      onMouseLeave={e => { (e.currentTarget).style.borderColor = 'var(--card-border)'; (e.currentTarget).style.color = 'var(--text-3)'; }}
    >
      <Globe size={11} /> Translate
    </button>
  );

  const statsSection = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '18px' }}>
      {[
        { icon: <Download size={13} />, label: 'Downloads', value: formatDownloads(hit.downloads) },
        { icon: <Heart size={13} />,   label: 'Followers',  value: formatDownloads(hit.follows) },
        { icon: <Clock size={13} />,   label: 'Updated',    value: formatDate(hit.date_modified) },
      ].map(s => (
        <div key={s.label} style={{
          background: 'var(--card)', border: '1px solid var(--card-border)',
          borderRadius: '10px', padding: '10px', textAlign: 'center',
        }}>
          <div style={{ color: accentHex, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{s.value}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-3)', marginTop: '2px', fontFamily: 'JetBrains Mono, monospace' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );

  const gallerySection = gallery.length > 0 ? (
    <div style={{ marginBottom: '22px' }}>
      <SectionTitle icon={<Images size={13} />}>Screenshots</SectionTitle>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {gallery.map((url, i) => (
          <div key={i} onClick={() => setLightboxImg(fullRes(url))}
            style={{
              flexShrink: 0, width: '200px', height: '112px',
              borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
              border: '1px solid var(--card-border)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; (e.currentTarget as HTMLElement).style.transform = ''; }}
          >
            <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  ) : null;

  const bodySection = cfData ? (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
      {cfData.descriptionHtml
        ? <div className="cf-description" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>
            {parseYouTubeParts(cfData.descriptionHtml).map((part, i) =>
              part.type === 'youtube'
                ? <YouTubeEmbed key={i} videoId={part.videoId} />
                : <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeCfHtml(part.content) }} />
            )}
          </div>
        : <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65 }}>{hit.description}</p>}
    </div>
  ) : (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--card-border)',
      borderRadius: '12px', padding: '16px', marginBottom: '22px',
    }}>
      {translating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0 12px', color: 'var(--text-3)', fontSize: '12px' }}>
          <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} color="var(--accent)" />
          Translating…
        </div>
      )}
      {projectBody || translatedBody
        ? <MarkdownBody content={translatedBody ?? projectBody!} accent={accentHex} />
        : <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.65 }}>{translatedDesc ?? hit.description}</p>
      }
      {translateBtn}
    </div>
  );

  const downloadSection = cfData ? (
    // ── CF download section ──────────────────────────────────────────
    <div style={{ background: 'var(--card)', border: `1px solid ${CF_ORANGE}28`, borderRadius: '14px', padding: '16px', marginBottom: '18px', boxShadow: `0 4px 24px ${CF_ORANGE}0d` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={13} color={CF_ORANGE} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif' }}>Download</span>
        </div>
        <a
          href={`curseforge://install?addonId=${cfData.modId}&source=cf_website`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px',
            background: `linear-gradient(135deg, ${CF_ORANGE}, #e8521a)`,
            color: 'white', borderRadius: '8px', border: 'none',
            fontSize: '11px', fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
            boxShadow: `0 2px 10px ${CF_ORANGE}4d`,
            transition: 'all 0.15s ease', cursor: 'pointer', textDecoration: 'none', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}
          title="Install with CurseForge App"
        >
          <img src="curseforge.png" width="11" height="11" alt="" style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
          Install with CurseForge
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div>
          <p style={label}>MC Version</p>
          <Dropdown options={allCfDlMcVersions.map(v => ({ value: v, label: v }))}
            value={cfDlMcVersion} onChange={v => { setCfDlMcVersion(v as string); setCfDlLoader(''); }}
            placeholder={`${allCfDlMcVersions.length} available`} searchable />
        </div>
        <div>
          <p style={label}>Mod Loader</p>
          <Dropdown options={allCfDlLoaders.map(l => ({ value: l, label: l, icon: getLoaderIcon(l.toLowerCase(), 14) }))}
            value={cfDlLoader} onChange={v => setCfDlLoader(v as string)}
            placeholder={allCfDlLoaders.length > 0 ? `${allCfDlLoaders.length} available` : 'Pick version first'}
            searchable={false} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        {(cfDlMcVersion || cfDlLoader) ? (
          <motion.div key="result" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.16 }}>
            {matchedCFFile ? (() => {
              const type = cfReleaseTypeName(matchedCFFile.releaseType);
              const typeColor = VERSION_TYPE_COLOR[type] ?? CF_ORANGE;
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: `${typeColor}0d`, border: `1px solid ${typeColor}22`, borderRadius: '9px', marginBottom: '8px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: typeColor }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{matchedCFFile.displayName}</span>
                    <span style={{ fontSize: '10px', color: typeColor, background: `${typeColor}18`, border: `1px solid ${typeColor}30`, padding: '2px 7px', borderRadius: '20px', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>{type}</span>
                  </div>
                  {matchedCFFile.downloadUrl ? (
                    <button onClick={() => { const a = document.createElement('a'); a.href = matchedCFFile.downloadUrl!; a.download = matchedCFFile.fileName; a.click(); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 13px', background: CF_ORANGE, border: 'none', borderRadius: '9px', cursor: 'pointer', transition: 'all 0.14s', textAlign: 'left', boxShadow: `0 4px 14px ${CF_ORANGE}40`, marginBottom: '4px' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}>
                      <Download size={12} color="white" />
                      <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', color: 'white', fontWeight: 600 }}>{matchedCFFile.fileName}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>{(matchedCFFile.fileLength / 1024 / 1024).toFixed(2)} MB</span>
                      <CheckCircle size={12} color="white" />
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 13px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '9px', fontSize: '12px', color: 'var(--red)', fontFamily: 'Instrument Sans, sans-serif' }}>
                      <AlertTriangle size={13} /> Distribution disabled by author
                    </div>
                  )}
                </div>
              );
            })() : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 13px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '9px', fontSize: '12px', color: 'var(--red)' }}>
                <AlertTriangle size={13} />
                No file matches{cfDlMcVersion ? ` MC ${cfDlMcVersion}` : ''}{cfDlLoader ? ` + ${cfDlLoader}` : ''}.
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ padding: '10px 12px', background: 'var(--bg-2)', borderRadius: '9px', fontSize: '11px', color: 'var(--text-3)', border: '1px dashed var(--card-border)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', marginBottom: '8px' }}>
              Pick a version and loader to find the right download
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setActiveTab('versions')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%', padding: '7px', border: '1px solid var(--card-border)', borderRadius: '8px', background: 'transparent', cursor: 'pointer', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif', transition: 'all 0.14s', marginTop: '4px' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}>
        View all {cfData.files.length} files →
      </button>
    </div>
  ) : (
    // ── Modrinth download section ────────────────────────────────────
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${accentHex}28`,
      borderRadius: '14px', padding: '16px', marginBottom: '18px',
      boxShadow: `0 4px 24px ${accentHex}0d`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={13} color={accentHex} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif' }}>Download</span>
        </div>
        <ModrinthInstallButton
          href={`modrinth://${installType}/${hit.slug}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px',
            background: 'linear-gradient(135deg, #1bca8e, #0ea5e9)',
            color: 'white', borderRadius: '8px', border: 'none',
            fontSize: '11px', fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
            boxShadow: '0 2px 10px rgba(27,202,142,0.3)',
            transition: 'all 0.15s ease', cursor: 'pointer', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
        />
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: 'var(--text-3)', fontSize: '12px' }}>
          <Loader2 size={14} color={accentHex} style={{ animation: 'spin 0.7s linear infinite' }} />
          Loading versions…
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={label}>MC Version</span>
                {snapshotCount > 0 && (
                  <button
                    onClick={() => setShowSnapshots(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                    title={showSnapshots ? 'Hide snapshots' : `Show ${snapshotCount} snapshots`}
                  >
                    <div style={{
                      width: '24px', height: '13px', borderRadius: '7px',
                      background: showSnapshots ? 'var(--accent)' : 'var(--card-border-hover)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', top: '2px', left: showSnapshots ? '13px' : '2px',
                        width: '9px', height: '9px', borderRadius: '50%',
                        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                        transition: 'left 0.18s',
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>snaps</span>
                  </button>
                )}
              </div>
              <Dropdown options={filteredMcVersions.map(v => ({ value: v, label: v }))}
                value={selectedMcVersion} onChange={v => setSelectedMcVersion(v as string)}
                placeholder={`${filteredMcVersions.length} available`} searchable />
            </div>
            <div>
              <p style={label}>Mod Loader</p>
              <Dropdown
                options={availableLoaders.map(l => ({ value: l, label: l, icon: getLoaderIcon(l, 14) }))}
                value={selectedLoader} onChange={v => setSelectedLoader(v as string)}
                placeholder={availableLoaders.length > 0 ? `${availableLoaders.length} available` : 'Pick version first'}
                searchable={false}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(selectedMcVersion || selectedLoader) && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.16 }}>
                {matchedVersion ? (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                      background: `${accentHex}0d`, border: `1px solid ${accentHex}22`,
                      borderRadius: '9px', marginBottom: '8px',
                    }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: VERSION_TYPE_COLOR[matchedVersion.version_type] ?? 'var(--text-3)' }} />
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', flex: 1 }}>{matchedVersion.version_number}</span>
                      <span style={{ fontSize: '10px', color: VERSION_TYPE_COLOR[matchedVersion.version_type], background: `${VERSION_TYPE_COLOR[matchedVersion.version_type]}18`, padding: '2px 7px', borderRadius: '20px', fontWeight: 700, textTransform: 'capitalize' }}>
                        {matchedVersion.version_type}
                      </span>
                    </div>
                    {matchedVersion.files.map(file => (
                      <button key={file.filename} onClick={() => handleDownload(file)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 13px',
                        background: file.primary ? accentHex : 'var(--card)',
                        border: `1px solid ${file.primary ? accentHex : 'var(--card-border)'}`,
                        borderRadius: '9px', cursor: 'pointer', marginBottom: '5px',
                        transition: 'all 0.14s', textAlign: 'left',
                        boxShadow: file.primary ? `0 4px 14px ${accentHex}40` : 'none',
                      }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.08)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}
                      >
                        <Download size={12} color={file.primary ? 'white' : accentHex} />
                        <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', color: file.primary ? 'white' : 'var(--text)', fontWeight: file.primary ? 600 : 400 }}>{file.filename}</span>
                        <span style={{ fontSize: '10px', flexShrink: 0, color: file.primary ? 'rgba(255,255,255,0.7)' : 'var(--text-3)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        {file.primary && <CheckCircle size={12} color="white" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 13px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '9px', fontSize: '12px', color: 'var(--red)' }}>
                    <AlertTriangle size={13} />
                    No version matches{selectedMcVersion ? ` MC ${selectedMcVersion}` : ''}{selectedLoader ? ` + ${selectedLoader}` : ''}.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedMcVersion && !selectedLoader && (
            <div style={{ padding: '10px 12px', background: 'var(--bg-2)', borderRadius: '9px', fontSize: '11px', color: 'var(--text-3)', border: '1px dashed var(--card-border)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}>
              Pick a version and loader to find the right download
            </div>
          )}
        </>
      )}
    </div>
  );

  const cfDeps = cfData?.cfDeps ?? [];

  const dependenciesSection = cfData ? (
    cfDeps.length > 0 ? (
      <div style={{ marginBottom: '18px' }}>
        <SectionTitle icon={<Package size={12} />}>Dependencies ({cfDeps.length})</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {cfDeps.map(dep => <CFDepCard key={dep.modId} dep={dep} accentColor={CF_ORANGE} />)}
        </div>
      </div>
    ) : null
  ) : deps.length > 0 ? (
    <div style={{ marginBottom: '18px' }}>
      <SectionTitle icon={<Package size={12} />}>Dependencies ({deps.length})</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {(showAllDeps ? deps : deps.slice(0, 5)).map(d => <DepCard key={d.project.id} info={d} />)}
      </div>
      {deps.length > 5 && (
        <button
          onClick={() => setShowAllDeps(s => !s)}
          style={{ marginTop: '6px', width: '100%', padding: '6px', background: 'none', border: '1px solid var(--card-border)', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 600, transition: 'all 0.14s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
        >
          {showAllDeps ? `Show less` : `Show ${deps.length - 5} more…`}
        </button>
      )}
    </div>
  ) : null;

  const ENV_COLOR: Record<string, string> = {
    required:    accentHex,
    optional:    '#f59e0b',
    unsupported: 'var(--text-3)',
    unknown:     'var(--text-3)',
  };
  const ENV_LABEL: Record<string, string> = {
    required:    'Required',
    optional:    'Optional',
    unsupported: 'Unsupported',
    unknown:     'Unknown',
  };

  const environmentSection = !cfData && (hit.client_side || hit.server_side) ? (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--card-border)',
      borderRadius: '14px', padding: '14px 16px', marginBottom: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
        <Globe size={13} color="var(--text-3)" />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Environment</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {([
          { label: 'Client', value: hit.client_side },
          { label: 'Server', value: hit.server_side },
        ] as const).map(({ label, value }) => {
          if (!value) return null;
          const color = ENV_COLOR[value] ?? 'var(--text-3)';
          const unsupported = value === 'unsupported' || value === 'unknown';
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-2)', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}>{label}</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                color, background: unsupported ? 'transparent' : `${color}14`,
                border: `1px solid ${unsupported ? 'var(--card-border)' : color + '30'}`,
                padding: '2px 9px', borderRadius: '20px',
                opacity: unsupported ? 0.5 : 1,
                textTransform: 'capitalize',
              }}>
                {ENV_LABEL[value] ?? value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const DONATION_LABELS: Record<string, string> = {
    'patreon': 'Patreon', 'bmac': 'Buy Me a Coffee', 'github': 'GitHub Sponsors',
    'opencollective': 'Open Collective', 'ko-fi': 'Ko-fi', 'paypal': 'PayPal',
  };

  const linkRows: { icon: React.ReactNode; label: string; url: string }[] = [];
  if (cfData) {
    if (cfData.links.website) linkRows.push({ icon: <Globe size={13} />,    label: 'Website',       url: cfData.links.website });
    if (cfData.links.issues)  linkRows.push({ icon: <Bug size={13} />,      label: 'Issue Tracker', url: cfData.links.issues });
    if (cfData.links.source)  linkRows.push({ icon: <Code2 size={13} />,    label: 'Source Code',   url: cfData.links.source });
    if (cfData.links.wiki)    linkRows.push({ icon: <BookOpen size={13} />, label: 'Wiki',          url: cfData.links.wiki });
  } else if (projectLinks) {
    if (projectLinks.issues)  linkRows.push({ icon: <Bug size={13} />,           label: 'Issue Tracker', url: projectLinks.issues });
    if (projectLinks.source)  linkRows.push({ icon: <Code2 size={13} />,         label: 'Source Code',   url: projectLinks.source });
    if (projectLinks.wiki)    linkRows.push({ icon: <BookOpen size={13} />,       label: 'Wiki',          url: projectLinks.wiki });
    if (projectLinks.discord) linkRows.push({ icon: <MessageCircle size={13} />, label: 'Discord',       url: projectLinks.discord });
    for (const d of projectLinks.donations) {
      linkRows.push({ icon: <Heart size={13} />, label: DONATION_LABELS[d.id] ?? d.platform, url: d.url });
    }
  }

  const linksSection = linkRows.length > 0 ? (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--card-border)',
      borderRadius: '14px', padding: '14px 16px', marginBottom: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <LinkIcon size={13} color="var(--text-3)" />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Links</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {linkRows.map(row => (
          <a key={row.url} href={row.url} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '9px',
              padding: '8px 10px', borderRadius: '8px',
              color: 'var(--text-2)', textDecoration: 'none',
              fontSize: '13px', fontFamily: 'Instrument Sans, sans-serif',
              fontWeight: 500, transition: 'all 0.13s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          >
            <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>{row.icon}</span>
            <span style={{ flex: 1 }}>{row.label}</span>
            <ExternalLink size={11} color="var(--text-3)" style={{ flexShrink: 0 }} />
          </a>
        ))}
      </div>
    </div>
  ) : null;

  const DISCLOSURE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    paid_features:       { label: 'Paid Features',        color: '#f59e0b', icon: <CreditCard size={12} /> },
    telemetry:           { label: 'Telemetry',            color: '#f43f5e', icon: <Radio size={12} /> },
    ai_content:          { label: 'AI-Generated Content', color: '#a78bfa', icon: <Bot size={12} /> },
    system_interactions: { label: 'System Access',        color: '#60a5fa', icon: <Monitor size={12} /> },
  };
  const CONSENT_LABEL: Record<string, string> = {
    always_active: 'Always active',
    opt_out:       'Opt-out',
    opt_in:        'Opt-in',
  };

  const disclosuresSection = !cfData && disclosures.length > 0 ? (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <AlertTriangle size={13} color="var(--text-3)" />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Disclosures</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {disclosures.map((d, i) => {
          const meta = DISCLOSURE_META[d.type] ?? { label: d.type, color: 'var(--text-3)', icon: <AlertTriangle size={12} /> };
          const rows: { label: string; value: string }[] = [];

          if (d.type === 'paid_features' && d.features.length > 0) {
            rows.push({ label: 'Features', value: d.features.join(', ') });
          }
          if (d.type === 'telemetry') {
            rows.push({ label: 'Consent', value: CONSENT_LABEL[d.consent] ?? d.consent });
            if (d.data_collected.length > 0) rows.push({ label: 'Collects', value: d.data_collected.join(', ') });
          }
          if (d.type === 'ai_content') {
            if (d.uses.length > 0) rows.push({ label: 'Used for', value: d.uses.map(u => u.charAt(0).toUpperCase() + u.slice(1)).join(', ') });
            if (d.note) rows.push({ label: 'Note', value: d.note });
          }
          if (d.type === 'system_interactions') {
            if (d.note) rows.push({ label: 'Note', value: d.note });
            if (d.interactions.length > 0) rows.push({ label: 'Access', value: d.interactions.join(', ') });
          }

          return (
            <div key={i} style={{ padding: '9px 11px', borderRadius: '9px', background: `${meta.color}0d`, border: `1px solid ${meta.color}28` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: rows.length ? '6px' : 0 }}>
                <span style={{ color: meta.color, display: 'flex', alignItems: 'center' }}>{meta.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: meta.color, fontFamily: 'Instrument Sans, sans-serif' }}>{meta.label}</span>
              </div>
              {rows.map(row => (
                <div key={row.label} style={{ display: 'flex', gap: '6px', fontSize: '11px', fontFamily: 'Instrument Sans, sans-serif', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--text-3)', minWidth: '52px', flexShrink: 0 }}>{row.label}</span>
                  <span style={{ color: 'var(--text-2)' }}>{row.value}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  ) : null;

  const sortedMembers = [...teamMembers].sort((a, b) => {
    const aOwner = a.role.toLowerCase() === 'owner';
    const bOwner = b.role.toLowerCase() === 'owner';
    if (aOwner && !bOwner) return -1;
    if (!aOwner && bOwner) return 1;
    return a.ordering - b.ordering;
  });

  const developersSection = cfData ? (
    cfData.authors.length > 0 ? (
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '14px 16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <Users size={13} color="var(--text-3)" />
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Authors</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {cfData.authors.map(a => (
            <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: 'var(--text-2)', textDecoration: 'none', fontSize: '13px', fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500, transition: 'all 0.13s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: `${CF_ORANGE}14`, border: `1px solid ${CF_ORANGE}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: CF_ORANGE }}>
                {a.name[0]?.toUpperCase()}
              </div>
              <span style={{ flex: 1 }}>{a.name}</span>
              <ExternalLink size={11} color="var(--text-3)" style={{ flexShrink: 0 }} />
            </a>
          ))}
        </div>
      </div>
    ) : null
  ) : (teamMembers.length > 0 || projectOrgId) ? (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--card-border)',
      borderRadius: '14px', padding: '14px 16px', marginBottom: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        <Users size={13} color="var(--text-3)" />
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Developers</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {projectOrgId && (
          <button
            onClick={() => navigate(`/org/${projectOrgId}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.13s', width: '100%' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, overflow: 'hidden', background: `${accentHex}14`, border: `1px solid ${accentHex}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {orgInfo?.iconUrl
                ? <img src={orgInfo.iconUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Building2 size={13} color={accentHex} />
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {orgInfo?.name ?? 'Organization'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>Organization</div>
            </div>
            <ExternalLink size={11} color="var(--text-3)" style={{ flexShrink: 0 }} />
          </button>
        )}
        {sortedMembers.map(member => {
          const isOwner = member.role.toLowerCase() === 'owner';
          return (
            <button
              key={member.user.id}
              onClick={() => navigate(`/user/${member.user.username}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.13s', width: '100%' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-2)', border: '1px solid var(--card-border)' }}>
                {member.user.avatar_url
                  ? <img src={member.user.avatar_url} alt={member.user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-3)', fontWeight: 700 }}>{member.user.username[0]?.toUpperCase()}</div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {member.user.username}
                  </span>
                  {isOwner && !projectOrgId && <Crown size={11} color="#f59e0b" title="Owner" style={{ flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', textTransform: 'capitalize' }}>
                  {member.role}
                </div>
              </div>
              <ExternalLink size={11} color="var(--text-3)" style={{ flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
    </div>
  ) : null;


  const categoriesSection = hit.display_categories?.length > 0 ? (
    <div style={{ marginBottom: '18px' }}>
      <SectionTitle icon={<Tag size={12} />}>Categories</SectionTitle>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
        {hit.display_categories.map(cat => (
          <span key={cat} style={{
            fontSize: '11px', color: accentHex, background: `${accentHex}12`,
            border: `1px solid ${accentHex}25`, padding: '3px 9px',
            borderRadius: '20px', fontWeight: 500, textTransform: 'capitalize',
          }}>
            {cat}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const versionsTabContent = cfData ? (
    // ── CF files tab ─────────────────────────────────────────────────
    <div>
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={13} color="var(--text-3)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input value={vTabSearch} onChange={e => setVTabSearch(e.target.value)} placeholder="Search files…"
          style={{ width: '100%', boxSizing: 'border-box', padding: '8px 32px 8px 32px', background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: '9px', fontSize: '13px', color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', outline: 'none', transition: 'border-color 0.15s' }}
          onFocus={e => { e.currentTarget.style.borderColor = `${CF_ORANGE}60`; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; }}
        />
        {vTabSearch && (
          <button onClick={() => setVTabSearch('')} style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
            <X size={13} color="var(--text-3)" />
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {cfTabAllMcVersions.length > 0 && (
          <div style={{ flex: '0 0 160px' }}>
            <p style={label}>MC Version</p>
            <Dropdown options={cfTabAllMcVersions.map(v => ({ value: v, label: v }))} value={vTabMc} onChange={v => setVTabMc(v as string)} placeholder="All versions" searchable />
          </div>
        )}
        {cfTabAllLoaders.length > 0 && (
          <div style={{ flex: '0 0 150px' }}>
            <p style={label}>Loader</p>
            <Dropdown options={cfTabAllLoaders.map(l => ({ value: l, label: l, icon: getLoaderIcon(l.toLowerCase(), 14) }))} value={vTabLoader} onChange={v => setVTabLoader(v as string)} placeholder="All loaders" searchable={false} />
          </div>
        )}
        <div>
          <p style={label}>Type</p>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['release', 'beta', 'alpha'] as const).map(type => {
              const active = vTabTypes.includes(type);
              return (
                <button key={type} onClick={() => setVTabTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                  style={{ padding: '5px 10px', borderRadius: '7px', cursor: 'pointer', border: `1px solid ${active ? VERSION_TYPE_COLOR[type] + '60' : 'var(--card-border)'}`, background: active ? VERSION_TYPE_COLOR[type] + '18' : 'var(--card)', color: active ? VERSION_TYPE_COLOR[type] : 'var(--text-3)', fontSize: '11px', fontWeight: 600, transition: 'all 0.14s', textTransform: 'capitalize', fontFamily: 'Instrument Sans, sans-serif' }}>
                  {type}
                </button>
              );
            })}
          </div>
        </div>
        {(vTabMc || vTabLoader || vTabTypes.length < 3 || vTabSearch) && (
          <button onClick={() => { setVTabMc(''); setVTabLoader(''); setVTabTypes(['release', 'beta', 'alpha']); setVTabSearch(''); }}
            style={{ alignSelf: 'flex-end', padding: '5px 10px', background: 'none', border: '1px solid var(--card-border)', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif', transition: 'all 0.14s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}>
            Reset
          </button>
        )}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
        {cfTabFilteredFiles.length} file{cfTabFilteredFiles.length !== 1 ? 's' : ''}{cfTabFilteredFiles.length !== cfData.files.length && ` of ${cfData.files.length}`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {cfTabFilteredFiles.map(file => {
          const type = cfReleaseTypeName(file.releaseType);
          const color = VERSION_TYPE_COLOR[type] ?? CF_ORANGE;
          const mcVers = cfFileMcVersions(file);
          const loaders = cfFileLoaders(file);
          const expanded = expandedVersion === String(file.id);
          return (
            <div key={file.id} style={{ border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden', background: expanded ? 'var(--card-hover)' : 'var(--card)', transition: 'background 0.14s' }}>
              <button onClick={() => setExpandedVersion(expanded ? null : String(file.id))}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 0 2px ${color}30` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{file.displayName}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'capitalize', color, background: color + '18', border: `1px solid ${color}30`, padding: '1px 7px', borderRadius: '20px', flexShrink: 0 }}>{type}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    {loaders.length > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {loaders.slice(0, 3).map(l => <span key={l} style={{ display: 'flex' }}>{getLoaderIcon(l.toLowerCase(), 12)}</span>)}
                        <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{loaders.join(', ')}</span>
                      </div>
                    )}
                    {loaders.length > 0 && mcVers.length > 0 && <span style={{ fontSize: '10px', color: 'var(--card-border-hover)' }}>·</span>}
                    {mcVers.length > 0 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {mcVers.length === 1 ? mcVers[0] : `${mcVers[mcVers.length - 1]}–${mcVers[0]}`}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', color: 'var(--card-border-hover)' }}>·</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{formatDate(file.fileDate)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <Download size={11} />{formatDownloads(file.downloadCount)}
                  </div>
                  <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: 'flex' }}>
                    <ChevronDown size={13} color="var(--text-3)" />
                  </motion.span>
                </div>
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ padding: '12px 14px' }}>
                      {mcVers.length > 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                          {mcVers.map(v => <span key={v} style={{ fontSize: '10px', color: 'var(--text-2)', background: 'var(--bg-2)', border: '1px solid var(--card-border)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>)}
                        </div>
                      )}
                      {file.downloadUrl ? (
                        <button onClick={() => { const a = document.createElement('a'); a.href = file.downloadUrl!; a.download = file.fileName; a.click(); }}
                          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 13px', background: CF_ORANGE, border: 'none', borderRadius: '9px', cursor: 'pointer', marginBottom: '5px', transition: 'all 0.14s', textAlign: 'left', boxShadow: `0 4px 14px ${CF_ORANGE}40` }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = 'brightness(1.1)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = ''; }}>
                          <Download size={12} color="white" />
                          <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', color: 'white', fontWeight: 600 }}>{file.fileName}</span>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>{(file.fileLength / 1024 / 1024).toFixed(2)} MB</span>
                          <CheckCircle size={12} color="white" />
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 13px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '9px', fontSize: '12px', color: 'var(--red)' }}>
                          <AlertTriangle size={13} /> Download not available (distribution disabled by author)
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {cfTabFilteredFiles.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--card-border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif' }}>
            No files match the current filters.
          </div>
        )}
      </div>
    </div>
  ) : (
    // ── Modrinth versions tab ────────────────────────────────────────
    <div>
      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <Search size={13} color="var(--text-3)" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
        <input
          value={vTabSearch}
          onChange={e => setVTabSearch(e.target.value)}
          placeholder="Search versions…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '8px 32px 8px 32px',
            background: 'var(--card)', border: '1px solid var(--card-border)',
            borderRadius: '9px', fontSize: '13px', color: 'var(--text)',
            fontFamily: 'Instrument Sans, sans-serif', outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'rgba(27,202,142,0.4)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--card-border)'; }}
        />
        {vTabSearch && (
          <button onClick={() => setVTabSearch('')} style={{
            position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex',
          }}>
            <X size={13} color="var(--text-3)" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '0 0 160px' }}>
          <p style={label}>MC Version</p>
          <Dropdown
            options={availableMcVersions.map(v => ({ value: v, label: v }))}
            value={vTabMc} onChange={v => setVTabMc(v as string)}
            placeholder="All versions" searchable
          />
        </div>
        <div style={{ flex: '0 0 150px' }}>
          <p style={label}>Loader</p>
          <Dropdown
            options={availableLoaders.map(l => ({ value: l, label: l, icon: getLoaderIcon(l, 14) }))}
            value={vTabLoader} onChange={v => setVTabLoader(v as string)}
            placeholder="All loaders" searchable={false}
          />
        </div>
        <div>
          <p style={label}>Version Type</p>
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['release', 'beta', 'alpha'] as const).map(type => {
              const active = vTabTypes.includes(type);
              return (
                <button key={type} onClick={() => setVTabTypes(prev =>
                  prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                )} style={{
                  padding: '5px 10px', borderRadius: '7px', cursor: 'pointer',
                  border: `1px solid ${active ? VERSION_TYPE_COLOR[type] + '60' : 'var(--card-border)'}`,
                  background: active ? VERSION_TYPE_COLOR[type] + '18' : 'var(--card)',
                  color: active ? VERSION_TYPE_COLOR[type] : 'var(--text-3)',
                  fontSize: '11px', fontWeight: 600, transition: 'all 0.14s',
                  textTransform: 'capitalize', fontFamily: 'Instrument Sans, sans-serif',
                }}>
                  {type}
                </button>
              );
            })}
          </div>
        </div>
        {(vTabMc || vTabLoader || vTabTypes.length < 3 || vTabSearch) && (
          <button
            onClick={() => { setVTabMc(''); setVTabLoader(''); setVTabTypes(['release', 'beta', 'alpha']); setVTabSearch(''); }}
            style={{
              alignSelf: 'flex-end', padding: '5px 10px',
              background: 'none', border: '1px solid var(--card-border)',
              borderRadius: '7px', cursor: 'pointer',
              fontSize: '11px', color: 'var(--text-3)',
              fontFamily: 'Instrument Sans, sans-serif', transition: 'all 0.14s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Count */}
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginBottom: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
        {loading ? 'Loading…' : (
          <>
            {tabFilteredVersions.length} version{tabFilteredVersions.length !== 1 ? 's' : ''}
            {tabFilteredVersions.length !== versions.length && ` of ${versions.length}`}
          </>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={22} color={accentHex} style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {tabFilteredVersions.map(v => (
            <div key={v.id} style={{
              border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden',
              background: expandedVersion === v.id ? 'var(--card-hover)' : 'var(--card)',
              transition: 'background 0.14s',
            }}>
              <button
                onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: VERSION_TYPE_COLOR[v.version_type] ?? 'var(--text-3)', boxShadow: `0 0 0 2px ${(VERSION_TYPE_COLOR[v.version_type] ?? '#888') + '30'}` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono, monospace' }}>{v.version_number}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'capitalize', color: VERSION_TYPE_COLOR[v.version_type], background: (VERSION_TYPE_COLOR[v.version_type] ?? '#888') + '18', border: `1px solid ${(VERSION_TYPE_COLOR[v.version_type] ?? '#888') + '30'}`, padding: '1px 7px', borderRadius: '20px' }}>
                      {v.version_type}
                    </span>
                    {v.featured && <span style={{ fontSize: '10px', color: accentHex, background: `${accentHex}14`, border: `1px solid ${accentHex}25`, padding: '1px 6px', borderRadius: '20px', fontWeight: 600 }}>featured</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {v.loaders.slice(0, 3).map(l => <span key={l} style={{ display: 'flex' }}>{getLoaderIcon(l, 12)}</span>)}
                      <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{v.loaders.join(', ')}</span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--card-border-hover)' }}>·</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {v.game_versions.length === 1 ? v.game_versions[0] : `${v.game_versions[v.game_versions.length - 1]}–${v.game_versions[0]}`}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--card-border-hover)' }}>·</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>{formatDate(v.date_published)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                    <Download size={11} />{formatDownloads(v.downloads)}
                  </div>
                  <motion.span animate={{ rotate: expandedVersion === v.id ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: 'flex' }}>
                    <ChevronDown size={13} color="var(--text-3)" />
                  </motion.span>
                </div>
              </button>

              <AnimatePresence>
                {expandedVersion === v.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid var(--card-border)' }}
                  >
                    <div style={{ padding: '12px 14px' }}>
                      {v.game_versions.length > 1 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginBottom: '10px' }}>
                          {v.game_versions.slice(0, 12).map(gv => (
                            <span key={gv} style={{ fontSize: '10px', color: 'var(--text-2)', background: 'var(--bg-2)', border: '1px solid var(--card-border)', padding: '2px 7px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace' }}>{gv}</span>
                          ))}
                          {v.game_versions.length > 12 && <span style={{ fontSize: '10px', color: 'var(--text-3)', padding: '2px 6px' }}>+{v.game_versions.length - 12} more</span>}
                        </div>
                      )}
                      {v.changelog && (
                        <div style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.55, marginBottom: '10px', fontFamily: 'Instrument Sans, sans-serif', maxHeight: '64px', overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent)' }}>
                          {v.changelog.replace(/^#+\s*/gm, '').substring(0, 280)}
                        </div>
                      )}
                      {v.files.map(file => (
                        <button key={file.filename} onClick={() => handleDownload(file)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '10px 12px',
                          background: file.primary ? `${accentHex}12` : 'var(--card)',
                          border: `1px solid ${file.primary ? `${accentHex}30` : 'var(--card-border)'}`,
                          borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                          transition: 'all 0.12s', textAlign: 'left',
                        }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${accentHex}50`; (e.currentTarget as HTMLElement).style.background = `${accentHex}1c`; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = file.primary ? `${accentHex}30` : 'var(--card-border)'; (e.currentTarget as HTMLElement).style.background = file.primary ? `${accentHex}12` : 'var(--card)'; }}
                        >
                          <Download size={12} color={file.primary ? accentHex : 'var(--text-3)'} />
                          <span style={{ fontSize: '11px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'JetBrains Mono, monospace', color: 'var(--text)' }}>{file.filename}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                          {file.primary && <CheckCircle size={12} color={accentHex} />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          {tabFilteredVersions.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--card-border)', borderRadius: '12px', fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif' }}>
              No versions match the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Lightbox (shared between modal and page) ──────────────────────
  const lightboxMeta = lightboxImg ? galleryMeta.find(g => imgHash(g.url) === imgHash(lightboxImg)) : null;

  const lightbox = lightboxImg ? (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={() => setLightboxImg(null)}
      style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', cursor: 'zoom-out' }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(92vw, 1400px)', cursor: 'default', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 32px 100px rgba(0,0,0,0.8)' }}
      >
        <img
          src={lightboxImg}
          alt="Screenshot"
          style={{ width: '100%', height: 'auto', maxHeight: '90vh', objectFit: 'contain', display: 'block' }}
        />

        {/* Top-right buttons */}
        <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              fetch(lightboxImg).then(r => r.blob()).then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = lightboxImg.split('/').pop() ?? 'screenshot';
                document.body.appendChild(a); a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
              });
            }}
            title="Download"
            style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.14s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.8)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.55)'; }}
          >
            <Download size={14} color="white" />
          </button>
          <button
            onClick={() => setLightboxImg(null)}
            title="Close"
            style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.14s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.8)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.55)'; }}
          >
            <X size={14} color="white" />
          </button>
        </div>

        {/* Bottom overlay: title + description */}
        {(lightboxMeta?.title || lightboxMeta?.description) && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '48px 18px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)', pointerEvents: 'none' }}>
            {lightboxMeta.title && (
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'white', fontFamily: 'Instrument Sans, sans-serif', marginBottom: lightboxMeta.description ? '4px' : 0 }}>
                {lightboxMeta.title}
              </div>
            )}
            {lightboxMeta.description && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.72)', fontFamily: 'Instrument Sans, sans-serif', lineHeight: 1.45 }}>
                {lightboxMeta.description}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  ) : null;

  // ── Screenshots tab content ───────────────────────────────────────
  const screenshotsTabContent = (
    <div>
      <div style={{ marginBottom: '14px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
        {gallery.length} screenshot{gallery.length !== 1 ? 's' : ''}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
        {gallery.map((url, i) => {
          const meta = galleryMeta.find(g => imgHash(g.url) === imgHash(url));
          const hovered = hoveredScreenshot === i;
          return (
            <div key={i}
              onClick={() => setLightboxImg(fullRes(url))}
              onMouseEnter={() => setHoveredScreenshot(i)}
              onMouseLeave={() => setHoveredScreenshot(null)}
              style={{
                position: 'relative', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in',
                border: `1px solid ${hovered ? 'var(--card-border-hover)' : 'var(--card-border)'}`,
                transition: 'all 0.15s', aspectRatio: '16/9', background: 'var(--bg-2)',
                transform: hovered ? 'scale(1.01)' : '',
                boxShadow: hovered ? '0 8px 32px rgba(0,0,0,0.4)' : '',
              }}
            >
              <img src={url} alt={meta?.title ?? `Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              {(meta?.title || meta?.description) && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '36px 12px 10px',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, transparent 100%)',
                  opacity: hovered ? 1 : 0, transition: 'opacity 0.18s',
                  pointerEvents: 'none',
                }}>
                  {meta.title && <div style={{ fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.title}</div>}
                  {meta.description && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontFamily: 'Instrument Sans, sans-serif', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta.description}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── Compare tab content ───────────────────────────────────────────
  const isModpack = !cfData && hit.project_type === 'modpack';

  const compareTabContent = isModpack ? (
    <div style={{ maxWidth: '740px' }}>
      {/* Selectors */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>From</p>
          <Dropdown
            options={versions.map(v => ({
              value: v.id,
              label: `${v.version_number}${v.name !== v.version_number ? ` — ${v.name}` : ''}`,
            }))}
            value={cmpA} onChange={v => { setCmpA(v as string); setCmpResult(null); setCmpError(false); }}
            placeholder="Select version…" searchable
          />
        </div>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>To</p>
          <Dropdown
            options={versions.map(v => ({
              value: v.id,
              label: `${v.version_number}${v.name !== v.version_number ? ` — ${v.name}` : ''}`,
            }))}
            value={cmpB} onChange={v => { setCmpB(v as string); setCmpResult(null); setCmpError(false); }}
            placeholder="Select version…" searchable
          />
        </div>
        <button
          disabled={!cmpA || !cmpB || cmpA === cmpB || cmpLoading}
          onClick={runCompare}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: (!cmpA || !cmpB || cmpA === cmpB || cmpLoading) ? 'not-allowed' : 'pointer',
            background: (!cmpA || !cmpB || cmpA === cmpB) ? 'var(--card)' : `linear-gradient(135deg, ${accentHex}, ${accentHex}cc)`,
            color: (!cmpA || !cmpB || cmpA === cmpB) ? 'var(--text-3)' : 'white',
            fontSize: '13px', fontWeight: 700, fontFamily: 'Instrument Sans, sans-serif',
            boxShadow: (!cmpA || !cmpB || cmpA === cmpB) ? 'none' : `0 2px 10px ${accentHex}40`,
            transition: 'all 0.15s', opacity: cmpLoading ? 0.7 : 1, flexShrink: 0, alignSelf: 'flex-end',
          }}
        >
          {cmpLoading
            ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <GitCompare size={13} />
          }
          {cmpLoading ? 'Comparing…' : 'Compare'}
        </button>
      </div>

      {cmpA === cmpB && cmpA && (
        <p style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif' }}>Select two different versions to compare.</p>
      )}

      {cmpError && !cmpLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 14px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', marginBottom: '16px' }}>
          <AlertTriangle size={14} color="#f43f5e" />
          <span style={{ fontSize: '13px', color: '#f43f5e', fontFamily: 'Instrument Sans, sans-serif' }}>
            Failed to load one or both versions. The files may not be available.
          </span>
        </div>
      )}

      {cmpResult && !cmpLoading && (
        <>
          {cmpResult.added.length === 0 && cmpResult.removed.length === 0 && cmpResult.updated.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif' }}>No changes detected between these versions.</p>
          ) : (
            <>
              {cmpResult.added.length > 0 && (
                <CmpSection title="Added" icon={<Plus size={13} color="#1bca8e" />} accent="#1bca8e" count={cmpResult.added.length}>
                  {cmpResult.added.map(mod => (
                    <CmpModRow key={mod.projectId} mod={mod} accent="#1bca8e"
                      versionId={mod.versionId}
                      expanded={expandedCmpMod === mod.projectId}
                      onToggle={() => toggleCmpMod(mod.projectId, mod.versionId)}
                      changelog={cmpChangelogs.get(mod.projectId)}
                    />
                  ))}
                </CmpSection>
              )}
              {cmpResult.removed.length > 0 && (
                <CmpSection title="Removed" icon={<Minus size={13} color="#f43f5e" />} accent="#f43f5e" count={cmpResult.removed.length}>
                  {cmpResult.removed.map(mod => (
                    <CmpModRow key={mod.projectId} mod={mod} accent="#f43f5e"
                      versionId={mod.versionId}
                      expanded={expandedCmpMod === mod.projectId}
                      onToggle={() => toggleCmpMod(mod.projectId, mod.versionId)}
                      changelog={cmpChangelogs.get(mod.projectId)}
                    />
                  ))}
                </CmpSection>
              )}
              {cmpResult.updated.length > 0 && (
                <CmpSection title="Updated" icon={<RefreshCw size={13} color="#f59e0b" />} accent="#f59e0b" count={cmpResult.updated.length}>
                  {cmpResult.updated.map(mod => (
                    <CmpModRow key={mod.projectId} mod={mod} accent="#f59e0b"
                      versionId={mod.versionId}
                      expanded={expandedCmpMod === mod.projectId}
                      onToggle={() => toggleCmpMod(mod.projectId, mod.versionId)}
                      changelog={cmpChangelogs.get(mod.projectId)}
                      badge={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{mod.fromVersion}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>→</span>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(27,202,142,0.15)', color: '#1bca8e', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>{mod.toVersion}</span>
                        </span>
                      }
                    />
                  ))}
                </CmpSection>
              )}
            </>
          )}
        </>
      )}
    </div>
  ) : null;

  // ── Tab bar ───────────────────────────────────────────────────────
  const tabs: { id: 'about' | 'screenshots' | 'versions' | 'compare'; label: string }[] = [
    { id: 'about',    label: 'About' },
    ...(gallery.length > 0 ? [{ id: 'screenshots' as const, label: `Screenshots (${gallery.length})` }] : []),
    { id: 'versions', label: cfData ? `Files (${cfData.files.length})` : `Versions${versions.length ? ` (${versions.length})` : ''}` },
    ...(isModpack ? [{ id: 'compare' as const, label: 'Compare' }] : []),
  ];

  const tabBar = (
    <div style={{
      display: 'flex',
      borderBottom: '1px solid var(--card-border)',
      padding: `0 ${mode === 'page' ? '40px' : '28px'}`,
      background: mode === 'modal' ? 'rgba(10,11,18,0.97)' : 'transparent',
      flexShrink: 0,
    }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
          style={{
            padding: '12px 4px', marginRight: '20px',
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: activeTab === tab.id ? 700 : 500,
            color: activeTab === tab.id ? 'var(--text)' : 'var(--text-3)',
            borderBottom: `2px solid ${activeTab === tab.id ? accentHex : 'transparent'}`,
            marginBottom: '-1px', transition: 'all 0.15s',
            fontFamily: 'Instrument Sans, sans-serif',
          }}
          onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
          onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // ── Content (two columns) ─────────────────────────────────────────
  const twoColumnContent = (
    <div style={{ display: 'flex', flex: 1, overflow: mode === 'modal' ? 'hidden' : 'visible', minHeight: 0 }}>
      {/* Left: tabbed content */}
      <div style={{
        flex: 1, borderRight: '1px solid var(--card-border)',
        display: 'flex', flexDirection: 'column',
        overflow: mode === 'modal' ? 'hidden' : 'visible',
      }}>
        {tabBar}
        <div style={{
          flex: 1, overflowY: mode === 'modal' ? 'auto' : 'visible',
          padding: mode === 'page' ? '28px 40px 60px' : '20px 28px',
        }}>
          {activeTab === 'about' ? (
            <div style={{ maxWidth: '740px' }}>
              {gallerySection}
              <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '14px', fontFamily: 'JetBrains Mono, monospace' }}>
                About
              </h3>
              {cfData ? (
                cfData.descriptionHtml
                  ? <div className="cf-description" style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>
            {parseYouTubeParts(cfData.descriptionHtml).map((part, i) =>
              part.type === 'youtube'
                ? <YouTubeEmbed key={i} videoId={part.videoId} />
                : <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeCfHtml(part.content) }} />
            )}
          </div>
                  : <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>{hit.description}</p>
              ) : (
                <>
                  {translating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-3)', fontSize: '12px' }}>
                      <Loader2 size={13} color="var(--accent)" style={{ animation: 'spin 0.8s linear infinite' }} /> Translating…
                    </div>
                  )}
                  {projectBody || translatedBody
                    ? <MarkdownBody content={translatedBody ?? projectBody!} accent={accentHex} />
                    : <p style={{ fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>{translatedDesc ?? hit.description}</p>
                  }
                  {translateBtn}
                </>
              )}
            </div>
          ) : activeTab === 'screenshots' ? screenshotsTabContent
          : activeTab === 'compare' ? compareTabContent
          : versionsTabContent}
        </div>
      </div>
      {/* Right: interactive */}
      <div style={{
        width: '380px', flexShrink: 0,
        overflowY: mode === 'modal' ? 'auto' : 'visible',
        padding: mode === 'page' ? '32px 28px 60px' : '20px',
        background: 'rgba(7,8,13,0.4)',
      }}>
        {statsSection}
        {environmentSection}
        {downloadSection}
        {linksSection}
        {disclosuresSection}
        {developersSection}
        {dependenciesSection}
        {categoriesSection}
        {cfData ? (
          <a href={`https://www.curseforge.com/minecraft/${cfModClassPath(cfData.classId)}/${cfData.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', textDecoration: 'none', transition: 'all 0.14s', marginTop: '8px', fontFamily: 'Instrument Sans, sans-serif' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
          >
            <img src="/curseforge.png" width="12" height="12" alt="" style={{ display: 'block', flexShrink: 0, opacity: 0.65 }} />
            View on CurseForge
          </a>
        ) : (
          <a href={`https://modrinth.com/${hit.project_type}/${hit.slug}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', border: '1px solid var(--card-border)', fontSize: '12px', fontWeight: 500, color: 'var(--text-3)', textDecoration: 'none', transition: 'all 0.14s', marginTop: '8px' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
          >
            <ExternalLink size={12} /> View on Modrinth
          </a>
        )}
      </div>
    </div>
  );

  // ── Page mode: full page, no modal chrome ─────────────────────────
  if (mode === 'page') {
    return (
      <>
        <AnimatePresence>{lightboxImg && lightbox}</AnimatePresence>
        {/* Page header bar */}
        <div style={{
          borderBottom: '1px solid var(--card-border)',
          background: 'rgba(7,8,13,0.6)', backdropFilter: 'blur(20px)',
          padding: '16px 24px',
        }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
              background: `linear-gradient(135deg, ${accentHex}20, ${accentHex}08)`,
              border: `1px solid ${accentHex}28`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {hit.icon_url && !imgError
                ? <img src={hit.icon_url} alt={hit.title} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <Package size={20} color={accentHex} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: '18px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {hit.title}
              </h1>
              {hit.author && <p style={{ fontSize: '12px', color: 'var(--text-3)' }}>by {hit.author}</p>}
            </div>
            {cfData && <img src="/curseforge.png" width="20" height="20" alt="CurseForge" style={{ opacity: 0.55, flexShrink: 0 }} />}
          </div>
        </div>
        <div style={{ maxWidth: '1440px', margin: '0 auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {twoColumnContent}
        </div>
      </>
    );
  }

  // ── Modal mode ─────────────────────────────────────────────────────
  const modalHeader = (
    <div style={{
      position: 'sticky', top: 0,
      background: 'rgba(10,11,18,0.94)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--card-border)',
      padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: '12px',
      zIndex: 10, borderRadius: '16px 16px 0 0', flexShrink: 0,
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0,
        background: `linear-gradient(135deg, ${accentHex}20, ${accentHex}08)`,
        border: `1px solid ${accentHex}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hit.icon_url && !imgError
          ? <img src={hit.icon_url} alt={hit.title} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={18} color={accentHex} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: '16px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hit.title}</h2>
        <p style={{ fontSize: '11px', color: 'var(--text-3)' }}>by {hit.author}</p>
      </div>
      {cfData && <img src="/curseforge.png" width="16" height="16" alt="CurseForge" style={{ opacity: 0.55, flexShrink: 0, marginRight: '4px' }} />}
      <button
        onClick={onClose}
        style={{
          width: '30px', height: '30px', borderRadius: '50%',
          background: 'var(--card)', border: '1px solid var(--card-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.14s', flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--card-hover)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--card)'}
      >
        <X size={13} color="var(--text-3)" />
      </button>
    </div>
  );

  return (
    <AnimatePresence>
      {lightboxImg && lightbox}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end', padding: '12px' }}
      >
        <motion.div
          initial={{ opacity: 0, x: 48, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 48, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '840px', height: '100%',
            background: 'rgba(10,11,18,0.97)', backdropFilter: 'blur(28px)',
            borderRadius: '16px', border: '1px solid var(--card-border)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {modalHeader}
          {twoColumnContent}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
