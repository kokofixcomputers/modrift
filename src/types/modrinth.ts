export interface Project {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: 'required' | 'optional' | 'unsupported' | 'unknown';
  server_side: 'required' | 'optional' | 'unsupported' | 'unknown';
  body: string;
  status: string;
  project_type: 'mod' | 'modpack' | 'resourcepack' | 'shader';
  downloads: number;
  followers: number;
  icon_url: string | null;
  id: string;
  team: string;
  published: string;
  updated: string;
  versions: string[];
  game_versions: string[];
  loaders: string[];
  gallery: GalleryImage[];
  color: number | null;
}

export interface GalleryImage {
  url: string;
  featured: boolean;
  title: string | null;
  description: string | null;
  created: string;
  ordering: number;
}

export interface SearchResult {
  hits: SearchHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface SearchHit {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: string;
  server_side: string;
  project_type: string;
  downloads: number;
  follows: number;
  icon_url: string | null;
  project_id: string;
  author: string;
  display_categories: string[];
  versions: string[];
  date_created: string;
  date_modified: string;
  latest_version: string | null;
  license: string;
  gallery: string[];
  featured_gallery: string | null;
  color: number | null;
}

export interface Version {
  id: string;
  project_id: string;
  author_id: string;
  featured: boolean;
  name: string;
  version_number: string;
  changelog: string | null;
  dependencies: Dependency[];
  game_versions: string[];
  version_type: 'release' | 'beta' | 'alpha';
  loaders: string[];
  files: VersionFile[];
  date_published: string;
  downloads: number;
  status: string;
}

export interface Dependency {
  version_id: string | null;
  project_id: string | null;
  file_name: string | null;
  dependency_type: 'required' | 'optional' | 'incompatible' | 'embedded';
}

export interface VersionFile {
  hashes: { sha512: string; sha1: string };
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type: string | null;
}

export interface SearchFilters {
  query: string;
  categories: string[];
  loaders: string[];
  versions: string[];
  projectType: string;
  sortBy: string;
  limit: number;
  offset: number;
}

export type SortOption = 'relevance' | 'downloads' | 'follows' | 'newest' | 'updated';

export interface Category {
  icon: string;
  name: string;
  project_type: string;
  header: string;
}

export interface GameVersion {
  version: string;
  version_type: string;
  date: string;
  major: boolean;
}

export interface Loader {
  icon: string;
  name: string;
  supported_project_types: string[];
}
