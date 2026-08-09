import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Package, Download, Calendar, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { formatDownloads, formatDate } from '../api/modrinth';

const api = axios.create({
  baseURL: 'https://api.modrinth.com/v2',
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

interface UserProject {
  slug: string; title: string; description: string; icon_url: string | null;
  project_type: string; downloads: number; follows: number;
  status: string; date_modified: string; color: number | null;
}

function ProjectCard({ p }: { p: UserProject }) {
  const navigate = useNavigate();
  const [err, setErr] = useState(false);
  const archived = p.status === 'archived';
  const accent = p.color ? `#${p.color.toString(16).padStart(6, '0')}` : '#1bca8e';

  return (
    <motion.button
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/mod/${p.slug}`)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '12px',
        padding: '14px 16px', borderRadius: '12px', cursor: 'pointer',
        background: 'var(--card)', border: '1px solid var(--card-border)',
        textAlign: 'left', width: '100%', transition: 'border-color 0.15s',
        opacity: archived ? 0.75 : 1,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
    >
      <div style={{
        width: '42px', height: '42px', borderRadius: '10px', flexShrink: 0,
        overflow: 'hidden', background: `${accent}14`,
        border: `1px solid ${accent}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {p.icon_url && !err
          ? <img src={p.icon_url} alt={p.title} onError={() => setErr(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Package size={18} color={accent} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '3px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', fontFamily: 'Instrument Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.title}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: accent, background: `${accent}14`, border: `1px solid ${accent}28`, padding: '1px 7px', borderRadius: '20px', textTransform: 'capitalize', flexShrink: 0 }}>
            {p.project_type}
          </span>
          {archived && (
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-2)', border: '1px solid var(--card-border)', padding: '1px 7px', borderRadius: '20px', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>
              archived
            </span>
          )}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'Instrument Sans, sans-serif', lineHeight: 1.45, margin: '0 0 6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {p.description}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            <Download size={11} />{formatDownloads(p.downloads)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
            <Calendar size={11} />{formatDate(p.date_modified)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

export default function UserPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError(false);
    Promise.all([
      api.get(`/user/${username}`),
      api.get(`/user/${username}/projects`),
    ]).then(([u, p]) => {
      setUser(u.data);
      setProjects(p.data);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [username]);

  if (loading) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
        <Loader2 size={28} color="var(--accent)" />
      </motion.div>
    </div>
  );

  if (error || !user) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
      <p style={{ fontSize: '15px', color: 'var(--text-2)' }}>User not found.</p>
      <button onClick={() => navigate(-1)} style={{ padding: '8px 16px', borderRadius: '9px', border: '1px solid var(--card-border)', background: 'var(--card)', color: 'var(--text-2)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Instrument Sans, sans-serif' }}>
        Go back
      </button>
    </div>
  );

  const activeProjects  = projects.filter(p => p.status !== 'archived');
  const archivedProjects = projects.filter(p => p.status === 'archived');

  return (
    <div style={{ flex: 1, maxWidth: '900px', margin: '0 auto', padding: '40px 24px 80px', width: '100%' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: '13px', fontFamily: 'Instrument Sans, sans-serif', padding: '4px 0', marginBottom: '28px', transition: 'color 0.15s' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '40px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
          overflow: 'hidden', background: 'var(--card)',
          border: '2px solid var(--card-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        }}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt={user.username} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--text-3)', fontWeight: 700 }}>{user.username?.[0]?.toUpperCase()}</div>
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
            <h1 style={{ fontFamily: 'Instrument Sans, sans-serif', fontSize: '26px', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.02em' }}>
              {user.username}
            </h1>
            {user.role === 'admin' && (
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', padding: '2px 9px', borderRadius: '20px', fontFamily: 'JetBrains Mono, monospace' }}>
                STAFF
              </span>
            )}
          </div>
          {user.bio && (
            <p style={{ fontSize: '14px', color: 'var(--text-2)', fontFamily: 'Instrument Sans, sans-serif', lineHeight: 1.6, margin: '0 0 10px' }}>
              {user.bio}
            </p>
          )}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </span>
            {user.created && (
              <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace' }}>
                Joined {formatDate(user.created)}
              </span>
            )}
          </div>
        </div>
        <a
          href={`https://modrinth.com/user/${user.username}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', borderRadius: '9px', border: '1px solid var(--card-border)', fontSize: '12px', color: 'var(--text-3)', textDecoration: 'none', transition: 'all 0.14s', flexShrink: 0, fontFamily: 'Instrument Sans, sans-serif', fontWeight: 500 }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border-hover)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-3)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'; }}
        >
          <img src="/modrinth.ico" width="13" height="13" alt="" style={{ display: 'block' }} />
          Modrinth
        </a>
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-3)', fontSize: '14px', fontFamily: 'Instrument Sans, sans-serif' }}>
          No public projects.
        </div>
      ) : (
        <>
          {activeProjects.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '12px' }}>
                Projects ({activeProjects.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '10px', marginBottom: '32px' }}>
                {activeProjects.map(p => <ProjectCard key={p.slug} p={p} />)}
              </div>
            </>
          )}
          {archivedProjects.length > 0 && (
            <>
              <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '12px' }}>
                Archived ({archivedProjects.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '10px' }}>
                {archivedProjects.map(p => <ProjectCard key={p.slug} p={p} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
