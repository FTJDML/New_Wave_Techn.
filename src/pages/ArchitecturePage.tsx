import { totalArchitectureView } from '@/data/curatedView';
import { ArchitectureViewPage } from './ArchitectureViewPage';

export function ArchitecturePage() {
  return <ArchitectureViewPage view={totalArchitectureView} tabKey="total" exportFileName="action-total-architecture.png" />;
}
