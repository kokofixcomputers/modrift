export interface CFMod {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  links: {
    websiteUrl: string;
    wikiUrl: string | null;
    issuesUrl: string | null;
    sourceUrl: string | null;
  };
  summary: string;
  status: number;
  downloadCount: number;
  isFeatured: boolean;
  primaryCategoryId: number;
  categories: CFCategory[];
  classId: number;
  authors: CFAuthor[];
  logo: CFAttachment | null;
  screenshots: CFAttachment[];
  mainFileId: number;
  latestFiles: CFFile[];
  latestFilesIndexes: CFFileIndex[];
  dateCreated: string;
  dateModified: string;
  dateReleased: string;
  allowModDistribution: boolean | null;
}

export interface CFCategory {
  id: number;
  gameId: number;
  name: string;
  slug: string;
  url: string;
  iconUrl: string;
  dateModified: string;
  isClass: boolean | null;
  classId: number | null;
  parentCategoryId: number | null;
  displayIndex: number | null;
}

export interface CFAuthor {
  id: number;
  name: string;
  url: string;
}

export interface CFAttachment {
  id: number;
  modId: number;
  title: string;
  description: string;
  thumbnailUrl: string;
  url: string;
}

export interface CFFile {
  id: number;
  gameId: number;
  modId: number;
  isAvailable: boolean;
  displayName: string;
  fileName: string;
  releaseType: 1 | 2 | 3;
  fileStatus: number;
  hashes: { value: string; algo: number }[];
  fileDate: string;
  fileLength: number;
  downloadCount: number;
  downloadUrl: string | null;
  gameVersions: string[];
  sortableGameVersions: {
    gameVersionName: string;
    gameVersionPadded: string;
    gameVersion: string;
    gameVersionReleaseDate: string;
    gameVersionTypeId: number;
  }[];
  dependencies: { modId: number; relationType: number }[];
  isServerPack: boolean;
  fileFingerprint: number;
  modules: { name: string; fingerprint: number }[];
}

export interface CFFileIndex {
  gameVersion: string;
  fileId: number;
  filename: string;
  releaseType: number;
  gameVersionTypeId: number | null;
  modLoader: number | null;
}

export interface CFSearchResult {
  data: CFMod[];
  pagination: {
    index: number;
    pageSize: number;
    resultCount: number;
    totalCount: number;
  };
}
