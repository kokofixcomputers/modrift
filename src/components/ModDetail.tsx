import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Heart, Clock, Package, ExternalLink, ChevronDown, CheckCircle, Tag, Calendar, AlertTriangle, Maximize2, Minimize2, Images, Loader2, Globe } from 'lucide-react';
import type { SearchHit, Version } from '../types/modrinth';
import { getProjectVersions, formatDownloads, formatDate, numToHex } from '../api/modrinth';
import { Dropdown } from './Dropdown';
import { getLoaderIcon } from './LoaderIcons';
import { MarkdownBody } from './MarkdownBody';
import { ModrinthInstallButton } from './ModrinthInstallButton';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';

const modrinthV2 = axios.create({
  baseURL: 'https://api.modrinth.com/v2',
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

interface ModDetailProps {
  hit: SearchHit;
  onClose: () => void;
  contextType?: string; // active tab type — fixes deep link for resourcepack/shader/datapack
}

const VERSION_TYPE_COLOR: Record<string, string> = {
  release: '#1bca8e',
  beta: '#f59e0b',
  alpha: '#ef4444',
};

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

function LoadingSpinner({ color }: { color: string }) {
  return (
    <div style={{
      width: '16px', height: '16px', borderRadius: '50%',
      border: `2px solid ${color}20`, borderTopColor: color,
      animation: 'spin 0.7s linear infinite', flexShrink: 0,
    }} />
  );
}

export function ModDetail({ hit, onClose, contextType }: ModDetailProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [projectBody, setProjectBody] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [fullscreen, setFullscreen] = useState(() => localStorage.getItem('detail-fullscreen') === 'true');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Translation state
  const { lang, translate, forceTranslate } = useLanguage();
  const [translatedDesc, setTranslatedDesc] = useState<string | null>(null);
  const [translatedBody, setTranslatedBody] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);

  const [selectedMcVersion, setSelectedMcVersion] = useState('');
  const [selectedLoader, setSelectedLoader] = useState('');
  const [showSnapshots, setShowSnapshots] = useState(false);

  const accentHex = numToHex(hit.color);

  // Deep link type: prefer contextType tab over hit.project_type when it's more specific
  const installType = (contextType && contextType !== 'all' && contextType !== 'server')
    ? contextType
    : hit.project_type;

  useEffect(() => {
    setLoading(true);
    setSelectedMcVersion('');
    setSelectedLoader('');
    setProjectBody(null);
    setTranslatedDesc(null);
    setTranslatedBody(null);
    Promise.all([
      getProjectVersions(hit.slug),
      modrinthV2.get(`/project/${hit.slug}`).then(r => r.data.body).catch(() => null),
    ]).then(([vers, body]) => {
      setVersions(vers);
      setProjectBody(body);
    }).catch(() => setVersions([])).finally(() => setLoading(false));
  }, [hit.slug]);

  // Translate when language changes or content loads
  useEffect(() => {
    setTranslatedDesc(null);
    setTranslatedBody(null);
    if (lang === 'en') return;

    let cancelled = false;
    setTranslating(true);

    const descText = hit.description;
    const bodyText = projectBody;

    const tasks: Promise<void>[] = [
      translate(descText).then(t => { if (!cancelled) setTranslatedDesc(t); }),
      bodyText ? translate(bodyText).then(t => { if (!cancelled) setTranslatedBody(t); }) : Promise.resolve(),
    ];

    Promise.all(tasks).finally(() => { if (!cancelled) setTranslating(false); });

    return () => { cancelled = true; };
  }, [lang, hit.slug, projectBody]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleForceTranslate = async () => {
    setTranslating(true);
    const target = lang;
    const tasks = [
      forceTranslate(hit.description, target).then(t => setTranslatedDesc(t)),
      projectBody ? forceTranslate(projectBody, target).then(t => setTranslatedBody(t)) : Promise.resolve(),
    ];
    await Promise.all(tasks);
    setTranslating(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const availableMcVersions = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const v of versions) {
      for (const gv of v.game_versions) {
        if (!seen.has(gv)) { seen.add(gv); result.push(gv); }
      }
    }
    return result.sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
  }, [versions]);

  const availableLoaders = useMemo(() => {
    const relevant = selectedMcVersion
      ? versions.filter(v => v.game_versions.includes(selectedMcVersion))
      : versions;
    const seen = new Set<string>();
    for (const v of relevant) {
      for (const l of v.loaders) { seen.add(l); }
    }
    return [...seen].sort();
  }, [versions, selectedMcVersion]);

  useEffect(() => {
    if (selectedLoader && !availableLoaders.includes(selectedLoader)) {
      setSelectedLoader('');
    }
  }, [availableLoaders, selectedLoader]);

  const matchedVersion = useMemo(() => {
    if (!selectedMcVersion && !selectedLoader) return null;
    const candidates = versions.filter(v => {
      const mcOk = !selectedMcVersion || v.game_versions.includes(selectedMcVersion);
      const loaderOk = !selectedLoader || v.loaders.includes(selectedLoader);
      return mcOk && loaderOk;
    });
    const priority = { release: 0, beta: 1, alpha: 2 };
    return candidates.sort((a, b) => {
      const pa = priority[a.version_type as keyof typeof priority] ?? 3;
      const pb = priority[b.version_type as keyof typeof priority] ?? 3;
      if (pa !== pb) return pa - pb;
      return new Date(b.date_published).getTime() - new Date(a.date_published).getTime();
    })[0] ?? null;
  }, [versions, selectedMcVersion, selectedLoader]);

  const handleDownload = (file: Version['files'][number]) => {
    const a = document.createElement('a');
    a.href = file.url;
    a.download = file.filename;
    a.click();
  };

  const isRelease = (v: string) => /^\d+(\.\d+)*$/.test(v);

  const filteredMcVersions = showSnapshots
    ? availableMcVersions
    : availableMcVersions.filter(isRelease);

  useEffect(() => {
    if (selectedMcVersion && !filteredMcVersions.includes(selectedMcVersion)) {
      setSelectedMcVersion('');
    }
  }, [showSnapshots]); // eslint-disable-line react-hooks/exhaustive-deps

  const snapshotCount = availableMcVersions.length - availableMcVersions.filter(isRelease).length;

  const mcVersionOptions = filteredMcVersions.map(v => ({ value: v, label: v }));
  const loaderOptions = availableLoaders.map(l => ({
    value: l,
    label: l,
    icon: getLoaderIcon(l, 15),
  }));

  // ─── Section JSX variables ────────────────────────────────────────────────

  const statsSection = (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '22px' }}>
      {[
        { icon: <Download size={14} />, label: 'Downloads', value: formatDownloads(hit.downloads) },
        { icon: <Heart size={14} />, label: 'Followers', value: formatDownloads(hit.follows) },
        { icon: <Clock size={14} />, label: 'Updated', value: formatDate(hit.date_modified) },
      ].map(stat => (
        <div key={stat.label} style={{
          background: 'var(--off-white)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '12px', textAlign: 'center',
        }}>
          <div style={{ color: accentHex, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }}>{stat.value}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{stat.label}</div>
        </div>
      ))}
    </div>
  );

  const gallery = hit.gallery ?? [];

  const gallerySection = gallery.length > 0 ? (
    <div style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginBottom: '10px' }}>
        <Images size={13} />
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: 'DM Mono, monospace' }}>
          Screenshots
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {gallery.map((url, i) => (
          <div
            key={i}
            onClick={() => setLightboxImg(url)}
            style={{
              flexShrink: 0, width: '180px', height: '108px',
              borderRadius: '10px', overflow: 'hidden',
              border: '1px solid var(--border)',
              cursor: 'pointer', position: 'relative',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.03)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = '';
              (e.currentTarget as HTMLElement).style.boxShadow = '';
            }}
          >
            <img src={url} alt={`Screenshot ${i + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </div>
  ) : null;

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
        (e.currentTarget).style.borderColor = 'var(--accent)';
        (e.currentTarget).style.color = 'var(--accent)';
      }}
      onMouseLeave={e => {
        (e.currentTarget).style.borderColor = 'var(--border)';
        (e.currentTarget).style.color = 'var(--text-muted)';
      }}
    >
      <Globe size={11} />
      Translate
    </button>
  );

  const bodySection = (
    <div style={{
      background: 'var(--off-white)', border: '1px solid var(--border)',
      borderRadius: '14px', padding: '16px', marginBottom: '22px',
    }}>
      {translating && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0 12px', color: 'var(--text-muted)', fontSize: '12px' }}>
          <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
          Translating...
        </div>
      )}
      {projectBody || translatedBody ? (
        <MarkdownBody content={translatedBody ?? projectBody!} accent={accentHex} />
      ) : (
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
          {translatedDesc ?? hit.description}
        </p>
      )}
      {translateBtn}
    </div>
  );

  const downloadSection = (
    <div style={{
      background: 'white',
      border: `1px solid ${accentHex}30`,
      borderRadius: '16px',
      padding: '18px',
      marginBottom: '22px',
      boxShadow: `0 4px 20px ${accentHex}10`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Download size={14} color={accentHex} />
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Download
          </span>
        </div>
        <ModrinthInstallButton
          href={`modrinth://${installType}/${hit.slug}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '5px 11px',
            background: 'linear-gradient(135deg, #1bca8e, #0ea5e9)',
            color: 'white', borderRadius: '8px', border: 'none',
            fontSize: '12px', fontWeight: 700, fontFamily: 'Syne, sans-serif',
            boxShadow: '0 2px 10px rgba(27,202,142,0.35)',
            transition: 'all 0.15s ease', cursor: 'pointer',
            flexShrink: 0,
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
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          <LoadingSpinner color={accentHex} />
          Loading version info...
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
                  textTransform: 'uppercase', color: 'var(--text-muted)',
                  fontFamily: 'DM Mono, monospace',
                }}>
                  MC Version
                </span>
                {snapshotCount > 0 && (
                  <button
                    onClick={() => setShowSnapshots(s => !s)}
                    style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                    title={showSnapshots ? 'Hide snapshots' : `Show ${snapshotCount} snapshot${snapshotCount !== 1 ? 's' : ''}`}
                  >
                    <div style={{
                      width: '26px', height: '14px', borderRadius: '7px',
                      background: showSnapshots ? 'var(--accent)' : 'var(--border-strong)',
                      position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
                    }}>
                      <div style={{
                        position: 'absolute', top: '2px',
                        left: showSnapshots ? '14px' : '2px',
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        transition: 'left 0.18s ease',
                      }} />
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                      snapshots
                    </span>
                  </button>
                )}
              </div>
              <Dropdown
                options={mcVersionOptions}
                value={selectedMcVersion}
                onChange={v => setSelectedMcVersion(v as string)}
                placeholder={`${filteredMcVersions.length} available`}
                searchable
              />
            </div>
            <div>
              <div style={{
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                fontFamily: 'DM Mono, monospace', marginBottom: '6px',
              }}>
                Mod Loader
              </div>
              <Dropdown
                options={loaderOptions}
                value={selectedLoader}
                onChange={v => setSelectedLoader(v as string)}
                placeholder={availableLoaders.length > 0 ? `${availableLoaders.length} available` : 'Pick version first'}
                searchable={false}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {(selectedMcVersion || selectedLoader) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {matchedVersion ? (
                  <div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 12px',
                      background: `${accentHex}08`,
                      border: `1px solid ${accentHex}20`,
                      borderRadius: '10px', marginBottom: '10px',
                    }}>
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                        background: VERSION_TYPE_COLOR[matchedVersion.version_type] ?? '#94a3b8',
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                          {matchedVersion.version_number}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          {matchedVersion.name !== matchedVersion.version_number ? matchedVersion.name : ''}
                        </span>
                      </div>
                      <span style={{
                        fontSize: '10px',
                        color: VERSION_TYPE_COLOR[matchedVersion.version_type],
                        background: `${VERSION_TYPE_COLOR[matchedVersion.version_type]}15`,
                        padding: '2px 7px', borderRadius: '20px', fontWeight: 600, textTransform: 'capitalize',
                      }}>
                        {matchedVersion.version_type}
                      </span>
                    </div>
                    {matchedVersion.files.map(file => (
                      <button
                        key={file.filename}
                        onClick={() => handleDownload(file)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                          padding: '11px 14px',
                          background: file.primary ? accentHex : 'var(--off-white)',
                          border: `1px solid ${file.primary ? accentHex : 'var(--border)'}`,
                          borderRadius: '10px', cursor: 'pointer', marginBottom: '6px',
                          transition: 'all 0.15s', textAlign: 'left',
                          boxShadow: file.primary ? `0 4px 12px ${accentHex}40` : 'none',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)';
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.filter = '';
                          (e.currentTarget as HTMLElement).style.transform = '';
                        }}
                      >
                        <Download size={13} color={file.primary ? 'white' : accentHex} />
                        <span style={{
                          fontSize: '12px', flex: 1, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: 'DM Mono, monospace',
                          color: file.primary ? 'white' : 'var(--text-primary)',
                          fontWeight: file.primary ? 600 : 400,
                        }}>
                          {file.filename}
                        </span>
                        <span style={{
                          fontSize: '11px', flexShrink: 0,
                          color: file.primary ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)',
                        }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        {file.primary && <CheckCircle size={13} color="white" />}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '12px', background: 'rgba(239,68,68,0.06)',
                    border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px',
                    fontSize: '13px', color: '#ef4444',
                  }}>
                    <AlertTriangle size={14} />
                    No version matches{selectedMcVersion ? ` MC ${selectedMcVersion}` : ''}{selectedLoader ? ` + ${selectedLoader}` : ''}.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedMcVersion && !selectedLoader && (
            <div style={{
              padding: '10px 12px', background: 'var(--off-white)', borderRadius: '10px',
              fontSize: '12px', color: 'var(--text-muted)', border: '1px dashed var(--border)', textAlign: 'center',
            }}>
              Pick a version and loader to find the right download
            </div>
          )}
        </>
      )}
    </div>
  );

  const categoriesSection = hit.display_categories?.length > 0 ? (
    <div style={{ marginBottom: '22px' }}>
      <SectionTitle icon={<Tag size={13} />} label="Categories" />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {hit.display_categories.map(cat => (
          <span key={cat} style={{
            fontSize: '12px', color: accentHex, background: `${accentHex}12`,
            border: `1px solid ${accentHex}25`, padding: '4px 10px',
            borderRadius: '20px', fontWeight: 500, textTransform: 'capitalize',
          }}>
            {cat}
          </span>
        ))}
      </div>
    </div>
  ) : null;

  const versionsSection = (
    <div>
      <SectionTitle icon={<Calendar size={13} />} label={`All Versions (${versions.length})`} />
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <LoadingSpinner color={accentHex} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {versions.slice(0, 20).map(v => (
            <div key={v.id} style={{
              border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden',
              background: expandedVersion === v.id ? 'white' : 'var(--off-white)',
              transition: 'all 0.15s ease',
            }}>
              <button
                onClick={() => setExpandedVersion(expandedVersion === v.id ? null : v.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: VERSION_TYPE_COLOR[v.version_type] ?? '#94a3b8',
                  boxShadow: `0 0 0 2px ${VERSION_TYPE_COLOR[v.version_type] ?? '#94a3b8'}30`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                      {v.version_number}
                    </span>
                    {v.featured && (
                      <span style={{ fontSize: '10px', color: accentHex, background: `${accentHex}15`, padding: '1px 6px', borderRadius: '20px', fontWeight: 600 }}>
                        featured
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {v.loaders.join(', ')} · {v.game_versions.slice(-1)[0]}{v.game_versions.length > 1 ? `–${v.game_versions[0]}` : ''} · {formatDate(v.date_published)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDownloads(v.downloads)}</span>
                  <motion.span animate={{ rotate: expandedVersion === v.id ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex' }}>
                    <ChevronDown size={13} color="var(--text-muted)" />
                  </motion.span>
                </div>
              </button>

              <AnimatePresence>
                {expandedVersion === v.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
                  >
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                        {v.game_versions.slice(0, 10).map(gv => (
                          <span key={gv} style={{
                            fontSize: '11px', color: 'var(--text-secondary)', background: 'white',
                            border: '1px solid var(--border)', padding: '2px 7px',
                            borderRadius: '4px', fontFamily: 'DM Mono, monospace',
                          }}>
                            {gv}
                          </span>
                        ))}
                        {v.game_versions.length > 10 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 7px' }}>
                            +{v.game_versions.length - 10} more
                          </span>
                        )}
                      </div>
                      {v.files.map(file => (
                        <button
                          key={file.filename}
                          onClick={() => handleDownload(file)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '9px 12px', background: 'var(--off-white)',
                            border: '1px solid var(--border)', borderRadius: '8px',
                            cursor: 'pointer', marginBottom: '5px', transition: 'all 0.12s', textAlign: 'left',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = `${accentHex}10`;
                            (e.currentTarget as HTMLElement).style.borderColor = `${accentHex}40`;
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--off-white)';
                            (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                          }}
                        >
                          <Download size={13} color={accentHex} />
                          <span style={{
                            fontSize: '12px', color: 'var(--text-primary)', flex: 1,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontFamily: 'DM Mono, monospace',
                          }}>
                            {file.filename}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          {file.primary && <CheckCircle size={12} color={accentHex} />}
                        </button>
                      ))}
                      {v.changelog && (
                        <div style={{
                          marginTop: '8px', padding: '10px', background: 'var(--surface)',
                          borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)',
                          lineHeight: 1.6, maxHeight: '80px', overflowY: 'auto',
                          fontFamily: 'DM Mono, monospace',
                        }}>
                          {v.changelog.slice(0, 300)}{v.changelog.length > 300 ? '...' : ''}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          {versions.length > 20 && (
            <a
              href={`https://modrinth.com/${hit.project_type}/${hit.slug}/versions`}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '10px', border: '1px dashed var(--border-strong)',
                fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              View {versions.length - 20} more on Modrinth <ExternalLink size={12} />
            </a>
          )}
        </div>
      )}
    </div>
  );

  // ─── Header JSX ──────────────────────────────────────────────────────────

  const header = (
    <div style={{
      position: 'sticky', top: 0,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)', padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: '14px',
      zIndex: 10, borderRadius: fullscreen ? '0' : '22px 22px 0 0',
      flexShrink: 0,
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
        background: `linear-gradient(135deg, ${accentHex}22, ${accentHex}08)`,
        border: `1px solid ${accentHex}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hit.icon_url && !imgError ? (
          <img src={hit.icon_url} alt={hit.title} onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Package size={22} color={accentHex} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{
          fontFamily: 'Syne, sans-serif', fontSize: '17px', fontWeight: 800,
          color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {hit.title}
        </h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>by {hit.author}</p>
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
        href={`https://modrinth.com/${hit.project_type}/${hit.slug}`}
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
      {/* Image lightbox */}
      {lightboxImg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px', cursor: 'zoom-out',
          }}
        >
          <img src={lightboxImg} alt="Screenshot"
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '14px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }} />
        </motion.div>
      )}

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
          {header}

          {fullscreen ? (
            // ── Two-column fullscreen layout ──────────────────────────────
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Left: markdown body */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '28px 36px',
                borderRight: '1px solid var(--border)',
              }}>
                <div style={{ maxWidth: '720px' }}>
                  {gallery.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '12px' }}>
                        Screenshots
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {gallery.map((url, i) => (
                          <div key={i} onClick={() => setLightboxImg(url)}
                            style={{ flexShrink: 0, width: '240px', height: '135px', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.14)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = ''; }}
                          >
                            <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 700,
                    color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase',
                    marginBottom: '16px',
                  }}>
                    About
                  </h3>
                  {translating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                      Translating...
                    </div>
                  )}
                  {projectBody || translatedBody ? (
                    <MarkdownBody content={translatedBody ?? projectBody!} accent={accentHex} />
                  ) : (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                      {translatedDesc ?? hit.description}
                    </p>
                  )}
                  {translateBtn}
                </div>
              </div>

              {/* Right: interactive panel */}
              <div style={{
                width: '420px', flexShrink: 0, overflowY: 'auto', padding: '22px',
                background: 'rgba(248,250,252,0.8)',
              }}>
                {statsSection}
                {downloadSection}
                {categoriesSection}
                {versionsSection}
              </div>
            </div>
          ) : (
            // ── Single-column normal layout ───────────────────────────────
            <div style={{ padding: '22px', flex: 1 }}>
              {statsSection}
              {gallerySection}
              {bodySection}
              {downloadSection}
              {categoriesSection}
              {versionsSection}
            </div>
          )}

          {footer}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
