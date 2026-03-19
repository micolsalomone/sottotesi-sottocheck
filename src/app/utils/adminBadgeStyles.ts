import type { CSSProperties } from 'react';

export type AdminBadgeTone =
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

export const adminBadgeBaseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.125rem 0.5rem',
  borderRadius: 'var(--radius-badge)',
  border: '1px solid transparent',
  fontFamily: 'var(--font-inter)',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--font-weight-medium)',
  lineHeight: '1.5',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const toneStyles: Record<AdminBadgeTone, CSSProperties> = {
  primary: {
    background: 'color-mix(in srgb, var(--primary) 12%, var(--background))',
    color: 'var(--primary)',
    border: '1px solid color-mix(in srgb, var(--primary) 22%, transparent)',
  },
  success: {
    background: 'color-mix(in srgb, var(--primary) 12%, var(--background))',
    color: 'var(--primary)',
    border: '1px solid color-mix(in srgb, var(--primary) 22%, transparent)',
  },
  warning: {
    background: 'color-mix(in srgb, var(--warning) 12%, var(--background))',
    color: 'var(--warning)',
    border: '1px solid color-mix(in srgb, var(--warning) 22%, transparent)',
  },
  danger: {
    background: 'color-mix(in srgb, var(--destructive-foreground) 10%, var(--background))',
    color: 'var(--destructive-foreground)',
    border: '1px solid color-mix(in srgb, var(--destructive-foreground) 18%, transparent)',
  },
  info: {
    background: 'color-mix(in srgb, var(--chart-2) 12%, var(--background))',
    color: 'var(--chart-2)',
    border: '1px solid color-mix(in srgb, var(--chart-2) 22%, transparent)',
  },
  neutral: {
    background: 'var(--muted)',
    color: 'var(--muted-foreground)',
    border: '1px solid var(--border)',
  },
  purple: {
    background: 'color-mix(in srgb, var(--chart-5) 12%, var(--background))',
    color: 'var(--chart-5)',
    border: '1px solid color-mix(in srgb, var(--chart-5) 22%, transparent)',
  },
};

export function getAdminBadgeStyle(tone: AdminBadgeTone = 'neutral'): CSSProperties {
  return {
    ...adminBadgeBaseStyle,
    ...toneStyles[tone],
  };
}
