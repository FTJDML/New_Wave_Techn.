import { logoRegistry } from '@/data/curatedView';
import { BRAND_ICONS } from './brandIcons';
import styles from './VendorLogo.module.css';

interface VendorLogoProps {
  readonly vendorId?: string;
  readonly size?: number;
}

/**
 * Resolves a vendorId to either a local simple-icons mark or a typographic wordmark.
 * Never fetches a remote URL and never falls back to a generic placeholder icon when
 * a vendor name is known — per CLAUDE.md's logo rules.
 */
export function VendorLogo({ vendorId, size = 20 }: VendorLogoProps) {
  if (!vendorId) return null;

  const definition = logoRegistry[vendorId];
  if (!definition) return null;

  if (definition.strategy === 'simple-icons' && definition.slug) {
    const icon = BRAND_ICONS[definition.slug];
    if (icon) {
      return (
        <svg
          role="img"
          aria-label={icon.title}
          viewBox={icon.viewBox}
          width={size}
          height={size}
          className={styles.icon}
          data-testid="vendor-logo-icon"
        >
          <path d={icon.path} fill={`#${icon.hex}`} />
        </svg>
      );
    }
  }

  const text = definition.text ?? vendorId;
  return (
    <span className={styles.wordmark} data-testid="vendor-logo-wordmark" style={{ fontSize: Math.max(size * 0.6, 11) }}>
      {text}
    </span>
  );
}
