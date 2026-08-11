import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cfGetMod, cfGetDescription, cfGetFiles, cfGetMods, cfModToHit } from '../api/curseforge';
import { ModDetail, type CFDetailData } from '../components/ModDetail';
import type { CFFile } from '../types/curseforge';

const CF_ORANGE = '#f16436';

export default function CFModPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [hit, setHit] = useState<ReturnType<typeof cfModToHit> | null>(null);
  const [cfData, setCfData] = useState<CFDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);
    setHit(null);
    setCfData(null);

    Promise.all([
      cfGetMod(id),
      cfGetDescription(id).catch(() => null),
      cfGetFiles(id).catch(() => [] as CFFile[]),
    ]).then(async ([mod, desc, files]) => {
      setHit(cfModToHit(mod));

      // Collect unique required/optional dependency modIds from all files
      const depMap = new Map<number, number>(); // modId → relationType (prefer required=3 over optional=2)
      for (const file of files) {
        for (const dep of file.dependencies) {
          if (dep.relationType !== 2 && dep.relationType !== 3) continue;
          if (dep.modId === mod.id) continue;
          const existing = depMap.get(dep.modId);
          if (!existing || dep.relationType > existing) depMap.set(dep.modId, dep.relationType);
        }
      }

      const depMods = depMap.size > 0
        ? await cfGetMods([...depMap.keys()]).catch(() => [])
        : [];

      const cfDeps = depMods.map(dm => ({
        modId: dm.id,
        name: dm.name,
        slug: dm.slug,
        logoUrl: dm.logo?.thumbnailUrl ?? null,
        relationType: depMap.get(dm.id) ?? 3,
        classId: dm.classId,
      }));

      setCfData({
        files,
        descriptionHtml: desc,
        links: {
          website: mod.links.websiteUrl || null,
          issues: mod.links.issuesUrl || null,
          source: mod.links.sourceUrl || null,
          wiki: mod.links.wikiUrl || null,
        },
        authors: mod.authors,
        modId: mod.id,
        slug: mod.slug,
        classId: mod.classId,
        screenshots: mod.screenshots.map(s => ({
          url: s.url,
          title: s.title,
          description: s.description,
        })),
        cfDeps,
      });
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 size={28} color={CF_ORANGE} />
        </motion.div>
      </div>
    );
  }

  if (error || !hit || !cfData) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <p style={{ fontSize: '15px', color: 'var(--text-2)', fontFamily: 'Instrument Sans, sans-serif' }}>Mod not found.</p>
        <button onClick={() => navigate('/')} style={{ padding: '8px 16px', borderRadius: '9px', border: '1px solid var(--card-border)', background: 'var(--card)', color: 'var(--text-2)', cursor: 'pointer', fontSize: '13px', fontFamily: 'Instrument Sans, sans-serif' }}>
          Go back home
        </button>
      </div>
    );
  }

  return (
    <ModDetail
      hit={hit}
      cfData={cfData}
      mode="page"
      onClose={() => navigate('/')}
    />
  );
}
