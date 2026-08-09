export const LOADER_COLORS: Record<string, string> = {
  // Mod loaders
  fabric:          '#C9AE70',
  forge:           '#C04000',
  neoforge:        '#F16421',
  quilt:           '#9722D4',
  babric:          '#A89060',
  liteloader:      '#3B82F6',
  modloader:       '#64748b',
  risugami:        '#64748b',
  rift:            '#64748b',
  // Plugin servers
  paper:           '#E74C3C',
  spigot:          '#F59E0B',
  bukkit:          '#F59E0B',
  purpur:          '#9B59B6',
  folia:           '#22C55E',
  sponge:          '#F7C948',
  // Proxy platforms
  velocity:        '#4B96E4',
  bungeecord:      '#E67E22',
  waterfall:       '#2980B9',
  // Geyser
  geyser:          '#70B2FF',
  geyser_plugin:   '#70B2FF',
  datapack:        '#64748b',
  liteloader:      '#3B82F6',
  'java-agent':    '#F59E0B',
  legacyfabric:    '#C9AE70',
  ornithe:         '#22C55E',
  nilloader:       '#64748b',
};

interface IconProps {
  color?: string;
  size?: number;
}

export function FabricIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" clipRule="evenodd" viewBox="0 0 24 24" width={size} height={size}>
      <path fill="none" d="M0 0h24v24H0z"/>
      <path fill="none" stroke={color} strokeWidth="23" d="m820 761-85.6-87.6c-4.6-4.7-10.4-9.6-25.9 1-19.9 13.6-8.4 21.9-5.2 25.4 8.2 9 84.1 89 97.2 104 2.5 2.8-20.3-22.5-6.5-39.7 5.4-7 18-12 26-3 6.5 7.3 10.7 18-3.4 29.7-24.7 20.4-102 82.4-127 103-12.5 10.3-28.5 2.3-35.8-6-7.5-8.9-30.6-34.6-51.3-58.2-5.5-6.3-4.1-19.6 2.3-25 35-30.3 91.9-73.8 111.9-90.8" transform="matrix(.08671 0 0 .0867 -49.8 -56)"/>
    </svg>
  );
}

export function ForgeIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={1.5} clipRule="evenodd" viewBox="0 0 24 24" width={size} height={size}>
      <path fill="none" d="M0 0h24v24H0z"/>
      <path fill="none" stroke={color} strokeWidth="2" d="M2 7.5h8v-2h12v2s-7 3.4-7 6 3.1 3.1 3.1 3.1l.9 3.9H5l1-4.1s3.8.1 4-2.9c.2-2.7-6.5-.7-8-6"/>
    </svg>
  );
}

export function NeoforgeIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size}>
      <g fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
        <path d="M12 19.2v2m0-2v2M8.4 1.3c.5 1.5.7 3 .1 4.6-.2.5-.9 1.5-1.6 1.5m8.7-6.1c-.5 1.5-.7 3-.1 4.6.2.6.9 1.5 1.6 1.5M3.6 15.8H1.9m18.5 0h1.7M3.2 12.1H1.5m19.3 0h1.8M8.1 12.7v1.6m7.8-1.6v1.6M10.8 18H12m0 1.2L10.8 18m2.4 0H12m0 1.2 1.2-1.2M4 9.7c-.5 1.2-.8 2.4-.8 3.7 0 3.1 2.9 6.3 5.3 8.2.9.7 2.2 1.1 3.4 1.1M12 4.9c-1.1 0-2.1.2-3.2.7M20 9.7c.5 1.2.8 2.4.8 3.7 0 3.1-2.9 6.3-5.3 8.2-.9.7-2.2 1.1-3.4 1.1M12 4.9c1.1 0 2.1.2 3.2.7M4 9.7c-.2-1.8-.3-3.7.5-5.5s2.2-2.6 3.9-3M20 9.7c.2-1.9.3-3.7-.5-5.5s-2.2-2.6-3.9-3M12 21.2l-2.4.4m2.4-.4 2.4.4"/>
      </g>
    </svg>
  );
}

export function BabricIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m12.35 5.89-.01.01c-1.75 1.47-6.67 5.23-9.7 7.86-.55.47-.67 1.62-.2 2.17 1.8 2.04 3.8 4.27 4.45 5.04.63.72 2.02 1.42 3.11.52 1.8-1.49 6.78-5.48 9.62-7.79"/>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.59 13.66c-.25-.33-1.57-2.13-.54-3.41.47-.61 1.56-1.04 2.25-.26.57.63.93 1.56-.29 2.57-.35.29-.83.68-1.39 1.14-.01-.01-.02-.03-.03-.04"/>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19.63 13.71-.01-.01c-.01-.01-.02-.03-.03-.04-.94-1.07-5.15-5.52-7.25-7.76-.58-.61-1.01-1.06-1.16-1.23-.27-.3-1.27-1.02.45-2.2 1.35-.92 1.85-.49 2.25-.09l7.42 7.6"/>
      <path fill={color} stroke={color} strokeWidth=".25" d="M10.635 14.774c.164-.257.246-.555.246-.876C10.881 12 9.258 12 8.07 12a.81.81 0 0 0-.82.804v4.39c0 .443.369.805.82.805.085-.002 1.473.008 1.508-.008.811-.024 1.672-.338 1.672-2.002 0-.266-.074-.796-.615-1.215Zm-1.016-.876a.5.5 0 0 1-.213.394h-.008a.66.66 0 0 1-.394.129H8.48v-1.038h.524c.336 0 .615.233.615.515Zm-.32 2.895h-.82v-1.038h.82c.416-.003.756.385.558.732-.09.177-.312.306-.558.306Z"/>
    </svg>
  );
}

export function QuiltIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={2} clipRule="evenodd" viewBox="0 0 24 24" width={size} height={size}>
      <path fill="none" d="M0 0h24v24H0z"/>
      <path fill="none" stroke={color} strokeWidth="65.6" d="M442.5 233.9c0-6.4-5.2-11.6-11.6-11.6h-197c-6.4 0-11.6 5.2-11.6 11.6v197c0 6.4 5.2 11.6 11.6 11.6h197c6.4 0 11.6-5.2 11.6-11.7v-197z" transform="matrix(.03053 0 0 .03046 -3.2 -3.2)"/>
      <path fill="none" stroke={color} strokeWidth="65.6" d="M442.5 233.9c0-6.4-5.2-11.6-11.6-11.6h-197c-6.4 0-11.6 5.2-11.6 11.6v197c0 6.4 5.2 11.6 11.6 11.6h197c6.4 0 11.6-5.2 11.6-11.7v-197z" transform="matrix(.03053 0 0 .03046 -3.2 7)"/>
      <path fill="none" stroke={color} strokeWidth="65.6" d="M442.5 233.9c0-6.4-5.2-11.6-11.6-11.6h-197c-6.4 0-11.6 5.2-11.6 11.6v197c0 6.4 5.2 11.6 11.6 11.6h197c6.4 0 11.6-5.2 11.6-11.7v-197z" transform="matrix(.03053 0 0 .03046 6.9 -3.2)"/>
      <path fill="none" stroke={color} strokeWidth="70.4" d="M442.5 234.8c0-7-5.6-12.5-12.5-12.5H234.7c-6.8 0-12.4 5.6-12.4 12.5V430c0 6.9 5.6 12.5 12.4 12.5H430c6.9 0 12.5-5.6 12.5-12.5z" transform="rotate(45 3.5 24)scale(.02843 .02835)"/>
    </svg>
  );
}

export function PaperIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={1.5} clipRule="evenodd" viewBox="0 0 24 24" width={size} height={size}>
      <path fill="none" d="M0 0h24v24H0z"/>
      <path fill="none" stroke={color} strokeWidth="2" d="m12 18 6 2 3-17L2 14l6 2"/>
      <path stroke={color} strokeWidth="2" d="m9 21-1-5 4 2z"/>
      <path fill={color} d="m12 18-4-2 10-9z"/>
    </svg>
  );
}

export function SpigotIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" stroke={color} viewBox="0 0 332 284" width={size} height={size} style={{ clipRule: 'evenodd', strokeLinejoin: 'round', fill: 'none', fillRule: 'nonzero', strokeWidth: '24px' }}>
      <path d="m147.5 27 27-15L202 27h66.5v33.5l-73-.912v45.5l26-.088v31.5H209V152l16 21.5h35V152h35.5v21.5H320V229h-24.5v17H260v-27h-35l-55.5 14.5L102 219l-15 14.5 18 12.5-3 24.5-41.5 1.5L12 252.5l6-19 24.5-4.5 16-41 79-36-7-15.5V105H154V59.5H80.5V27z"/>
    </svg>
  );
}

export function BukkitIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" stroke={color} viewBox="0 0 292 319" width={size} height={size} style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M12 109.5V155l22.5 69h23v47L81 294h79V172h99.087L265 155v-45.5m-253 0V64h22.5V41L81 17h114.5L241 41v23h24v45.5m-253 0h69V132h114.5v-22.5H265m-.913 94.5v40M207.5 272v40m42.5-40v40h30v-40zm-57.5-68v40h30v-40z" transform="translate(0 -5)" style={{ fill: 'none', fillRule: 'nonzero', strokeWidth: '24px' }}/>
    </svg>
  );
}

export function FoliaIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size} height={size}>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  );
}

export function PurpurIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={1.5} clipRule="evenodd" viewBox="0 0 24 24" width={size} height={size}>
      <path fill="none" d="M0 0h24v24H0z"/>
      <path fill="none" stroke={color} strokeWidth="1.77" d="m264 29.95-8 4 8 4.42 8-4.42z" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
      <path fill="none" stroke={color} strokeWidth="1.77" d="m272 38.37-8 4.42-8-4.42" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
      <path fill="none" stroke={color} strokeWidth="1.77" d="m260 31.95 8 4.21V45" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
      <path fill="none" stroke={color} strokeWidth="1.77" d="M260 45v-8.84l8-4.21" transform="matrix(1.125 0 0 1.1372 -285 -31.69)"/>
      <path fill="none" stroke={color} strokeWidth="1.68" d="m264 41.95 8-4v8l-8 4z" transform="matrix(1.125 0 0 1.2569 -285 -40.78)"/>
      <path fill="none" stroke={color} strokeWidth="1.68" d="m264 41.95 8-4v8l-8 4z" transform="matrix(-1.125 0 0 1.2569 309 -40.78)"/>
    </svg>
  );
}

export function SpongeIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" stroke={color} viewBox="0 0 268 313" width={size} height={size} style={{ clipRule: 'evenodd', strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none', fillRule: 'nonzero', strokeWidth: '24px' }}>
      <path d="M84.299 35.5C78.752 21.724 65.262 12 49.5 12 28.789 12 12 28.789 12 49.5S28.789 87 49.5 87 87 70.211 87 49.5c0-4.949-.959-9.674-2.701-14m0 0L129 27l28 65m0 0-99 20-18 47.5 15.5 37-25 32.5v72H253l2.5-72L222 112zm-60 65v15m94-13.5V172m-67.5 45h46L157 267.5h-14.5z"/>
    </svg>
  );
}

export function VelocityIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill={color} viewBox="0 0 500 500" width={size} height={size}>
      <path d="m236.25 232.55-54.08-73.79a11.86 11.86 0 0 0-11.91-4.62L84 171.57a11.88 11.88 0 0 0-8 5.88l-42.64 77.07a11.84 11.84 0 0 0 .81 12.75l54.21 74a11.86 11.86 0 0 0 11.91 4.62l86-17.37a11.85 11.85 0 0 0 8-5.89l42.78-77.3a11.86 11.86 0 0 0-.82-12.78m-59.45 74.21a9.57 9.57 0 0 1-13.39-2.06l-31-42.24a16 16 0 0 0-16-6.21l-52.58 10.63a9.58 9.58 0 0 1-11.29-7.49A9.58 9.58 0 0 1 60 248.1l57-11.52a16 16 0 0 0 10.81-7.92L156.42 177a9.58 9.58 0 0 1 13-3.75 9.58 9.58 0 0 1 3.75 13L146.81 234a16 16 0 0 0 1.09 17.16l31 42.23a9.58 9.58 0 0 1-2.1 13.37"/>
      <circle cx="416.44" cy="236.11" r="9.83"/>
      <path d="M458.29 265.6H280.52a9.83 9.83 0 1 1 0-19.66h106.22a9.84 9.84 0 0 0 0-19.67h-70.2a9.83 9.83 0 1 1 0-19.66H422.9a9.84 9.84 0 0 0 0-19.67H202.83l33.42 45.61a11.86 11.86 0 0 1 .81 12.75l-42.78 77.3a11.8 11.8 0 0 1-1.4 2h212.29a9.83 9.83 0 1 0 0-19.66h-53.53a9.84 9.84 0 1 1 0-19.67h106.65a9.84 9.84 0 1 0 0-19.67"/>
    </svg>
  );
}

export function BungeecordIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 24 24" width={size} height={size} style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
      <path d="M0 0h24v24H0z" style={{ fill: 'none' }}/>
      <path d="M3.778 19.778C3.778 21.004 4.774 22 6 22a2.224 2.224 0 0 0 2.222-2.222v-3.334A2.224 2.224 0 0 0 6 14.222V7.556c0-1.829 1.171-3.334 3-3.334s3 1.505 3 3.334v8.888" style={{ fill: 'none', fillRule: 'nonzero', stroke: color, strokeWidth: '2px' }}/>
      <path d="m7 15-1-2-1 2z" style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeMiterlimit: 1.5 }}/>
      <path d="M20.222 4.444A2.224 2.224 0 0 0 18 2.222a2.224 2.224 0 0 0-2.222 2.222v3.334C15.778 9.004 16.774 10 18 10v6.667C18 18.495 16.829 20 15 20s-3-1.505-3-3.333V7.778" style={{ fill: 'none', fillRule: 'nonzero', stroke: color, strokeWidth: '2px' }}/>
      <path d="m17 9.222 1 2 1-2z" style={{ fill: 'none', stroke: color, strokeWidth: '2px', strokeMiterlimit: 1.5 }}/>
    </svg>
  );
}

export function WaterfallIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width={size} height={size}>
      <path d="m12 2.69 5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  );
}

export function GeyserIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 24 24" width={size} height={size} style={{ fillRule: 'evenodd', clipRule: 'evenodd', strokeLinecap: 'round', strokeLinejoin: 'round', strokeMiterlimit: 1.5 }}>
      <path d="M-29.359 21.58s.347-4.964-2.603-9.503l3.419 1.511 2.032-4.165s.407 5.006.717 6.82l4.201-2.269s-3.582 5.066-3.339 7.726" style={{ fill: 'none', stroke: color, strokeWidth: '1.81px' }} transform="matrix(1.04036 0 0 1.1631 40.307 -2.368)"/>
      <path d="M-28.662 13.511s-.605-4.431-3.127-5.772c-.957-.256-1.802 1.129-2.839.953-.783-.134-.92-1.322.118-2.625 1.253-1.572 3.754-3.239 7.51-3.133s7.899 2.025 8.029 4.378c-.139 1.765-2.05.754-2.05.754s-2.885-1.535-4.801 7.697" style={{ fill: 'none', stroke: color, strokeWidth: '1.81px' }} transform="matrix(1.04036 0 0 1.1631 40.432 -2.278)"/>
      <path d="M-33.825 10.737s-1.006.602-1.867 2.089" style={{ fill: 'none', stroke: color, strokeWidth: '1.81px' }} transform="matrix(1.0317 -.13393 .14973 1.15343 36.882 -5.8)"/>
      <path d="M-21.195 10.385s1.378.38 1.947 1.615" style={{ fill: 'none', stroke: color, strokeWidth: '1.81px' }} transform="matrix(1.04036 0 0 1.1631 41.36 -1.513)"/>
    </svg>
  );
}

export function DatapackIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill={color} viewBox="0 0 20 20" width={size} height={size}>
      <path fillRule="evenodd" d="M9.504 1.132a1 1 0 0 1 .992 0l1.75 1a1 1 0 1 1-.992 1.736L10 3.152l-1.254.716a1 1 0 1 1-.992-1.736zM5.618 4.504a1 1 0 0 1-.372 1.364L5.016 6l.23.132a1 1 0 1 1-.992 1.736L4 7.723V8a1 1 0 0 1-2 0V6a1 1 0 0 1 .52-.878l1.734-.99a1 1 0 0 1 1.364.372m8.764 0a1 1 0 0 1 1.364-.372l1.733.99A1 1 0 0 1 18 6v2a1 1 0 1 1-2 0v-.277l-.254.145a1 1 0 1 1-.992-1.736l.23-.132-.23-.132a1 1 0 0 1-.372-1.364m-7 4a1 1 0 0 1 1.364-.372L10 8.848l1.254-.716a1 1 0 1 1 .992 1.736L11 10.58V12a1 1 0 1 1-2 0v-1.42l-1.246-.712a1 1 0 0 1-.372-1.364M3 11a1 1 0 0 1 1 1v1.42l1.246.712a1 1 0 1 1-.992 1.736l-1.75-1A1 1 0 0 1 2 14v-2a1 1 0 0 1 1-1m14 0a1 1 0 0 1 1 1v2a1 1 0 0 1-.504.868l-1.75 1a1 1 0 1 1-.992-1.736L16 13.42V12a1 1 0 0 1 1-1m-9.618 5.504a1 1 0 0 1 1.364-.372l.254.145V16a1 1 0 1 1 2 0v.277l.254-.145a1 1 0 1 1 .992 1.736l-1.735.992a1 1 0 0 1-1.022 0l-1.735-.992a1 1 0 0 1-.372-1.364" clipRule="evenodd"/>
    </svg>
  );
}

export function LiteloaderIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit={1.5} clipRule="evenodd" viewBox="0 0 24 24" width={size} height={size}>
      <path d="M3.924 21.537S7.485 20.426 12 15.172c2.544-2.959 2.311-1.986 4-4.172" stroke={color} strokeWidth="2"/>
      <path d="M7.778 19s1.208-.48 4.222 0c2.283.364 6.037-4.602 6.825-6.702 1.939-5.165.894-10.431.894-10.431S15.442 6.803 12.864 9c-5.105 4.352-6.509 11-6.509 11" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

export function JavaAgentIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m18 2 4 4M17 7l3-3M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6"/>
    </svg>
  );
}

export function LegacyFabricIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <g stroke={color} strokeLinecap="round" strokeLinejoin="round" clipPath="url(#lf-clip)">
        <path strokeWidth="1.994" d="M21.302 9.979 13.88 2.384c-.4-.408-.902-.833-2.246.086-1.726 1.18-.728 1.9-.45 2.203.71.78 7.291 7.716 8.427 9.017.217.242-1.76-1.951-.563-3.442.468-.607 1.56-1.04 2.254-.26.564.632.928 1.56-.295 2.574-2.141 1.769-8.844 7.144-11.012 8.93-1.084.893-2.471.2-3.104-.52-.65-.771-2.653-3-4.448-5.046-.477-.546-.356-1.699.2-2.167 3.034-2.627 7.968-6.399 9.702-7.873"/>
        <path strokeWidth="2" d="M8 13v4h2"/>
      </g>
      <defs>
        <clipPath id="lf-clip"><path fill="#fff" d="M0 0h24v24H0z"/></clipPath>
      </defs>
    </svg>
  );
}

export function OrnitheIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h-.01M20.6 18H12a8 8 0 0 1-8-8V7a4 4 0 0 1 7.28-2.3L22 20"/>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m4 7-2 .5L4 8M14 18v3M10 17.75V21M17 18a5.999 5.999 0 0 1-3.84-10.61"/>
    </svg>
  );
}

export function NilloaderIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
      <ellipse cx="12" cy="11" stroke={color} strokeWidth="2" rx="5" ry="8"/>
      <path stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.563 2.725 6.756 19.71l5.63 3.251"/>
    </svg>
  );
}

export function GenericLoaderIcon({ color = 'currentColor', size = 16 }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 8v4l3 3"/>
    </svg>
  );
}

export function getLoaderIcon(name: string, size = 16): React.ReactNode {
  const color = LOADER_COLORS[name.toLowerCase()] ?? '#64748b';
  switch (name.toLowerCase()) {
    case 'fabric':   return <FabricIcon color={color} size={size} />;
    case 'forge':    return <ForgeIcon color={color} size={size} />;
    case 'neoforge': return <NeoforgeIcon color={color} size={size} />;
    case 'babric':   return <BabricIcon color={color} size={size} />;
    case 'quilt':    return <QuiltIcon color={color} size={size} />;
    case 'paper':         return <PaperIcon color={color} size={size} />;
    case 'spigot':        return <SpigotIcon color={color} size={size} />;
    case 'bukkit':        return <BukkitIcon color={color} size={size} />;
    case 'folia':         return <FoliaIcon color={color} size={size} />;
    case 'purpur':        return <PurpurIcon color={color} size={size} />;
    case 'sponge':        return <SpongeIcon color={color} size={size} />;
    case 'velocity':      return <VelocityIcon color={color} size={size} />;
    case 'bungeecord':    return <BungeecordIcon color={color} size={size} />;
    case 'waterfall':     return <WaterfallIcon color={color} size={size} />;
    case 'geyser':
    case 'geyser_plugin':  return <GeyserIcon color={color} size={size} />;
    case 'datapack':       return <DatapackIcon color={color} size={size} />;
    case 'liteloader':     return <LiteloaderIcon color={color} size={size} />;
    case 'java-agent':     return <JavaAgentIcon color={color} size={size} />;
    case 'legacy-fabric':
    case 'legacyfabric':   return <LegacyFabricIcon color={color} size={size} />;
    case 'ornithe':        return <OrnitheIcon color={color} size={size} />;
    case 'nilloader':      return <NilloaderIcon color={color} size={size} />;
    default:               return <GenericLoaderIcon color={color} size={size} />;
  }
}
