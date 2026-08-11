import axios from 'axios';
import type { CFMod, CFSearchResult, CFFile } from '../types/curseforge';
import type { SearchHit } from '../types/modrinth';

const cf = axios.create({ baseURL: 'https://curseforgeproxy.kokodev.cc' });

const GAME_ID = 432;

const CLASS_TO_TYPE: Record<number, string> = {
  6: 'mod',
  4471: 'modpack',
  12: 'resourcepack',
  6552: 'shader',
  5: 'plugin',
};

export function cfModToHit(mod: CFMod): SearchHit {
  const cats = mod.categories.filter(c => !c.isClass).map(c => c.name.toLowerCase());
  return {
    slug: String(mod.id),
    title: mod.name,
    description: mod.summary,
    categories: cats,
    client_side: 'unknown',
    server_side: 'unknown',
    project_type: CLASS_TO_TYPE[mod.classId] ?? 'mod',
    downloads: mod.downloadCount,
    follows: 0,
    icon_url: mod.logo?.thumbnailUrl ?? null,
    project_id: String(mod.id),
    author: mod.authors[0]?.name ?? '',
    display_categories: cats,
    versions: [],
    date_created: mod.dateCreated,
    date_modified: mod.dateModified,
    latest_version: null,
    license: '',
    gallery: mod.screenshots.map(s => s.url),
    featured_gallery: null,
    color: null,
  };
}

const CF_SORT: Record<string, number> = {
  relevance: 2,
  downloads: 6,
  newest: 11,
  updated: 3,
  follows: 1,
};

const CF_CLASS: Record<string, number> = {
  mod: 6,
  modpack: 4471,
  resourcepack: 12,
  shader: 6552,
  plugin: 5,
};

const LOADER_ENUM: Record<string, number> = {
  forge: 1, cauldron: 2, liteloader: 3, fabric: 4, quilt: 5, neoforge: 6,
};

export async function cfSearch(filters: {
  query?: string;
  projectType?: string;
  sortBy?: string;
  versions?: string[];
  loaders?: string[];
  limit?: number;
  offset?: number;
}): Promise<{ hits: SearchHit[]; total_hits: number }> {
  const params: Record<string, string | number> = {
    gameId: GAME_ID,
    pageSize: filters.limit ?? 20,
    index: filters.offset ?? 0,
    sortField: CF_SORT[filters.sortBy ?? 'relevance'] ?? 2,
    sortOrder: 'desc',
  };
  if (filters.query) params.searchFilter = filters.query;
  const classId = filters.projectType && filters.projectType !== 'all' ? CF_CLASS[filters.projectType] : 0;
  if (classId) params.classId = classId;
  if (filters.versions?.length) params.gameVersion = filters.versions[0];
  if (filters.loaders?.length) {
    const loaderEnum = LOADER_ENUM[filters.loaders[0].toLowerCase()];
    if (loaderEnum) params.modLoaderType = loaderEnum;
  }

  const { data } = await cf.get<CFSearchResult>('/v1/mods/search', { params });
  return {
    hits: data.data.map(cfModToHit),
    total_hits: data.pagination.totalCount,
  };
}

export async function cfGetMod(id: string): Promise<CFMod> {
  const { data } = await cf.get<{ data: CFMod }>(`/v1/mods/${id}`);
  return data.data;
}

export async function cfGetDescription(id: string): Promise<string> {
  const { data } = await cf.get<{ data: string }>(`/v1/mods/${id}/description`);
  return data.data;
}

export async function cfGetMods(ids: number[]): Promise<CFMod[]> {
  if (!ids.length) return [];
  const { data } = await cf.post<{ data: CFMod[] }>('/v1/mods', { modIds: ids });
  return data.data;
}

export async function cfGetFiles(id: string): Promise<CFFile[]> {
  const { data } = await cf.get<{ data: CFFile[] }>(`/v1/mods/${id}/files`, {
    params: { pageSize: 50, sortOrder: 'desc' },
  });
  return data.data;
}
