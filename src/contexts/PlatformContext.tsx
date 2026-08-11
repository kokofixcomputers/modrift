import { createContext, useContext, useState } from 'react';

export type Platform = 'modrinth' | 'curseforge';

interface PlatformCtx {
  platform: Platform;
  setPlatform: (p: Platform) => void;
}

const Ctx = createContext<PlatformCtx>({ platform: 'modrinth', setPlatform: () => {} });

export function PlatformProvider({ children }: { children: React.ReactNode }) {
  const [platform, setPlatform] = useState<Platform>('modrinth');
  return <Ctx.Provider value={{ platform, setPlatform }}>{children}</Ctx.Provider>;
}

export function usePlatform() {
  return useContext(Ctx);
}
