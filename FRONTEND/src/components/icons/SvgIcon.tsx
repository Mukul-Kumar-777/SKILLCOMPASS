import type { CSSProperties } from 'react';

type IconProps = {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  title?: string;
};

/**
 * Self-contained icon system so the UI never depends on an external icon CDN.
 * Every icon is rendered as a real SVG with explicit dimensions and a stable
 * viewBox, which also prevents flex/grid layouts from collapsing the artwork.
 */
export function SvgIcon({ name, size = 24, strokeWidth = 2.15, className, title }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: `sc-icon${className ? ` ${className}` : ''}`,
    'aria-hidden': title ? undefined : true,
    role: title ? 'img' : undefined,
    style: { display: 'block', flex: '0 0 auto', overflow: 'visible' } as CSSProperties,
  };

  const icon = (() => {
    switch (name) {
      case 'home': return <><path d="m3 10.7 9-7.5 9 7.5"/><path d="M5 9.2v10.3a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19.5V9.2"/><path d="M9.2 21v-6.2h5.6V21"/></>;
      case 'github': return <path fill="currentColor" stroke="none" fillRule="evenodd" clipRule="evenodd" d="M12 2.2A10 10 0 0 0 8.84 21.68c.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.1-1.47-1.1-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.9 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.5 9.5 0 0 1 12 6.84a9.5 9.5 0 0 1 2.5.34c1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10 10 0 0 0 12 2.2Z"/>;
      case 'layers': return <><path d="m12 3 9 4.7-9 4.8-9-4.8L12 3Z"/><path d="m3 12 9 4.8 9-4.8"/><path d="m3 16.8 9 4.8 9-4.8"/></>;
      case 'chart': return <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 16v-3M12 16V8M17 16v-6"/></>;
      case 'briefcase': return <><rect x="2.7" y="7.5" width="18.6" height="13" rx="2.2"/><path d="M8 7.5V5.7A1.8 1.8 0 0 1 9.8 4h4.4A1.8 1.8 0 0 1 16 5.7v1.8M2.7 12h18.6M10 12v2h4v-2"/></>;
      case 'target': return <><circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="12" r="5.5"/><path d="m13.1 5.8-4.3 7.1h3.7l-1 5.3 4.7-7.3h-3.6l.5-5.1Z" fill="currentColor" stroke="none"/></>;
      case 'message': return <><path d="M5 4h14a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/><path d="M8 9h8M8 13h5"/></>;
      case 'settings': return <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.84l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05a1.7 1.7 0 0 0-1.84-.34 1.7 1.7 0 0 0-1.02 1.56V21a2 2 0 1 1-4 0v-.11A1.7 1.7 0 0 0 9 19.38a1.7 1.7 0 0 0-1.84.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.67 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.11a1.7 1.7 0 0 0 1.56-1A1.7 1.7 0 0 0 4.33 7l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.62a1.7 1.7 0 0 0 1.02-1.56V3a2 2 0 1 1 4 0v.11A1.7 1.7 0 0 0 15 4.62a1.7 1.7 0 0 0 1.84-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.33 9c.17.6.74 1 1.37 1H21a2 2 0 1 1 0 4h-.11c-.63 0-1.2.4-1.49 1Z"/></>;
      case 'help': return <><circle cx="12" cy="12" r="9.3"/><path d="M9.2 9.1a2.9 2.9 0 1 1 5.1 1.9c-1 1.05-2.3 1.3-2.3 3.15"/><circle cx="12" cy="17.4" r=".8" fill="currentColor" stroke="none"/></>;
      case 'search': return <><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 5 5"/></>;
      case 'bell': return <><path d="M18 9a6 6 0 0 0-12 0c0 6.8-3 7.1-3 9h18c0-1.9-3-2.2-3-9Z"/><path d="M10 22h4"/></>;
      case 'chevron': return <path d="m7.5 9.5 4.5 4.5 4.5-4.5"/>;
      case 'arrow': return <><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></>;
      case 'play': return <path d="m9 6 10 6-10 6V6Z" fill="currentColor" stroke="none"/>;
      case 'bookmark': return <path d="M6 4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21l-6-3.5L6 21V4.5Z"/>;
      case 'sparkle': return <path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z" fill="currentColor" stroke="none"/>;
      case 'code': return <><path d="m9 6-6 6 6 6"/><path d="m15 6 6 6-6 6"/><path d="m14 4-4 16"/></>;
      case 'link': return <><path d="M10 13a5 5 0 0 0 7.1.1l2-2A5 5 0 0 0 12 4l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.2-1.2"/></>;
      case 'folder': return <><path d="M3 7a3 3 0 0 1 3-3h4l2 2h6a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z"/><path d="M3.5 9h17"/></>;
      case 'refresh': return <><path d="M20 11a8 8 0 0 0-14.7-4L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.7 4L21 15"/><path d="M21 20v-5h-5"/></>;
      case 'repo': return <><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 11h5M8 15h8"/></>;
      case 'star': return <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>;
      case 'gitbranch': return <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 5h3a7 7 0 0 1 7 7v5M8 5v2a5 5 0 0 0 5 5h3"/></>;
      case 'chevronRight': return <path d="m9 6 6 6-6 6"/>;
      case 'external': return <><path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></>;
      case 'users': return <><path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20"/><circle cx="9.5" cy="7.5" r="3.5"/><path d="M16 11a3.5 3.5 0 1 0 0-7M21 20v-1.5a4 4 0 0 0-3-3.87"/></>;
      case 'clock': return <><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5l3.5 2"/></>;
      case 'playCircle': return <><circle cx="12" cy="12" r="9.5"/><path d="m10 8 6 4-6 4z" fill="currentColor" stroke="none"/></>;
      case 'loader': return <path d="M20 12a8 8 0 1 1-2.34-5.66" className="spin-icon"/>;
      case 'file': return <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></>;
      case 'gitcommit': return <><circle cx="12" cy="12" r="3"/><path d="M2.5 12H9M15 12h6.5"/></>;
      case 'x': return <><path d="m6 6 12 12M18 6 6 18"/></>;
      case 'check': return <path d="m5 12 4 4L19 6"/>;
      default: return null;
    }
  })();

  if (!icon) return <span className={`sc-icon-fallback${className ? ` ${className}` : ''}`} style={{ width: size, height: size }} aria-hidden="true">•</span>;

  return <svg {...common}>{title && <title>{title}</title>}{icon}</svg>;
}

