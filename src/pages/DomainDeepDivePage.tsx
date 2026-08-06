import { Navigate, useParams } from 'react-router-dom';
import {
  storeCheckoutView,
  digitalCommerceView,
  erpSupplyView,
  dataIntelligenceView,
  peopleServiceView,
  foundationSecurityView,
} from '@/data/deepDiveViews';
import type { DomainTabKey } from '@/components/shell/DomainTabs';
import type { ArchitectureView } from '@/types/architecture';
import { ArchitectureViewPage } from './ArchitectureViewPage';

const DOMAIN_VIEWS: Readonly<Record<string, { readonly view: ArchitectureView; readonly tabKey: DomainTabKey }>> = {
  store: { view: storeCheckoutView, tabKey: 'store' },
  digital: { view: digitalCommerceView, tabKey: 'digital' },
  'erp-supply': { view: erpSupplyView, tabKey: 'erp-supply' },
  data: { view: dataIntelligenceView, tabKey: 'data' },
  'people-service': { view: peopleServiceView, tabKey: 'people-service' },
  foundation: { view: foundationSecurityView, tabKey: 'foundation' },
};

export function DomainDeepDivePage() {
  const { domain } = useParams<{ domain: string }>();
  const entry = domain ? DOMAIN_VIEWS[domain] : undefined;

  if (!entry) {
    return <Navigate to="/architecture" replace />;
  }

  return <ArchitectureViewPage view={entry.view} tabKey={entry.tabKey} exportFileName={`action-${entry.view.id}.png`} />;
}
