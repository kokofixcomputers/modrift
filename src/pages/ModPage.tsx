import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { ModDetail } from '../components/ModDetail';
import type { SearchHit } from '../types/modrinth';

const api = axios.create({
  baseURL: 'https://api.modrinth.com/v2',
  headers: { 'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)' },
});

export default function ModPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [hit, setHit] = useState<SearchHit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(false);

    Promise.all([
      api.get(`/project/${slug}`),
      api.get(`/project/${slug}/members`).catch(() => ({ data: [] })),
    ]).then(([projRes, membersRes]) => {
      const p = projRes.data;
      const owner = (membersRes.data as { role: string; user: { username: string } }[])
        .find(m => m.role === 'Owner');

      setHit({
        slug: p.slug,
        title: p.title,
        description: p.description,
        categories: p.categories ?? [],
        client_side: p.client_side,
        server_side: p.server_side,
        project_type: p.project_type,
        downloads: p.downloads,
        follows: p.followers,
        icon_url: p.icon_url,
        project_id: p.id,
        author: owner?.user?.username ?? '',
        display_categories: p.categories ?? [],
        versions: p.versions ?? [],
        date_created: p.published,
        date_modified: p.updated,
        latest_version: null,
        license: p.license?.id ?? '',
        gallery: (p.gallery ?? []).map((g: { url: string }) => g.url),
        featured_gallery: null,
        color: p.color ?? null,
      });
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 size={28} color="var(--accent)" />
        </motion.div>
      </div>
    );
  }

  if (error || !hit) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-2)' }}>Project not found.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px', borderRadius: '9px', border: '1px solid var(--card-border)',
            background: 'var(--card)', color: 'var(--text-2)', cursor: 'pointer', fontSize: '13px',
            fontFamily: 'Instrument Sans, sans-serif',
          }}
        >
          Go back home
        </button>
      </div>
    );
  }

  return (
    <ModDetail
      hit={hit}
      onClose={() => navigate(-1)}
      mode="page"
    />
  );
}
