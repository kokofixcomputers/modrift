import axios from 'axios';
import type { SearchResult, SearchFilters, Version, Project, Category, GameVersion, Loader } from '../types/modrinth';

const BASE = 'https://api.modrinth.com/v2';

const client = axios.create({
  baseURL: BASE,
  headers: {
    'User-Agent': 'BetterModrinth/1.0 (kokocanfixit@gmail.com)',
  },
});

export async function searchProjects(filters: Partial<SearchFilters>): Promise<SearchResult> {
  const params: Record<string, string | number> = {
    limit: filters.limit ?? 20,
    offset: filters.offset ?? 0,
    index: filters.sortBy ?? 'relevance',
  };

  if (filters.query) params.query = filters.query;

  const facets: string[][] = [];

  if (filters.categories?.length) {
    facets.push(filters.categories.map(c => `categories:${c}`));
  }
  if (filters.loaders?.length) {
    facets.push(filters.loaders.map(l => `categories:${l}`));
  }
  if (filters.versions?.length) {
    facets.push(filters.versions.map(v => `versions:${v}`));
  }
  if (filters.projectType && filters.projectType !== 'all') {
    facets.push([`project_type:${filters.projectType}`]);
  }

  if (facets.length > 0) {
    params.facets = JSON.stringify(facets);
  }

  const { data } = await client.get<SearchResult>('/search', { params });
  return data;
}

export async function getProject(slug: string): Promise<Project> {
  const { data } = await client.get<Project>(`/project/${slug}`);
  return data;
}

export async function getProjectVersions(slug: string): Promise<Version[]> {
  const { data } = await client.get<Version[]>(`/project/${slug}/version`);
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await client.get<Category[]>('/tag/category');
  return data;
}

export async function getGameVersions(): Promise<GameVersion[]> {
  const { data } = await client.get<GameVersion[]>('/tag/game_version');
  return data;
}

export async function getLoaders(): Promise<Loader[]> {
  const { data } = await client.get<Loader[]>('/tag/loader');
  return data;
}

export function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function numToHex(n: number | null): string {
  if (!n) return '#1bca8e';
  return `#${n.toString(16).padStart(6, '0')}`;
}
