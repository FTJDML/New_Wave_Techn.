import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { VendorLogo } from '../../src/components/logo/VendorLogo';

afterEach(() => {
  cleanup();
});

describe('VendorLogo', () => {
  it('renders nothing when no vendorId is given', () => {
    const { container } = render(<VendorLogo />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a local simple-icons mark for a vendor with a resolvable slug', () => {
    render(<VendorLogo vendorId="VEN-SAP" />);
    expect(screen.getByTestId('vendor-logo-icon')).toBeTruthy();
  });

  it('renders a typographic wordmark for a vendor declared as wordmark in the data', () => {
    render(<VendorLogo vendorId="VEN-CTAC" />);
    const wordmark = screen.getByTestId('vendor-logo-wordmark');
    expect(wordmark.textContent).toBe('ctac');
  });

  it('overrides VEN-MICROSOFT to a wordmark, since simple-icons has no Azure mark (audit §4)', () => {
    render(<VendorLogo vendorId="VEN-MICROSOFT" />);
    const wordmark = screen.getByTestId('vendor-logo-wordmark');
    expect(wordmark.textContent).toBe('Microsoft Azure');
  });

  it('overrides VEN-SERVICENOW to a wordmark, since simple-icons has no ServiceNow mark (audit §4)', () => {
    render(<VendorLogo vendorId="VEN-SERVICENOW" />);
    const wordmark = screen.getByTestId('vendor-logo-wordmark');
    expect(wordmark.textContent).toBe('ServiceNow');
  });

  it('renders nothing for a vendorId with no registry entry', () => {
    const { container } = render(<VendorLogo vendorId="VEN-DOES-NOT-EXIST" />);
    expect(container.firstChild).toBeNull();
  });
});
