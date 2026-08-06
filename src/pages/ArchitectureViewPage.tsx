import { useSearchParams } from 'react-router-dom';
import type { ArchitectureView } from '@/types/architecture';
import { AppHeader } from '@/components/shell/AppHeader';
import { DomainTabs, type DomainTabKey } from '@/components/shell/DomainTabs';
import { ArchitectureCanvas } from '@/components/canvas/ArchitectureCanvas';
import { DetailDrawer } from '@/components/drawer/DetailDrawer';
import { buildViewSummary, formatViewSummary } from '@/lib/viewSummary';
import styles from './ArchitecturePage.module.css';

interface ArchitectureViewPageProps {
  readonly view: ArchitectureView;
  readonly tabKey: DomainTabKey;
  readonly exportFileName: string;
}

export function ArchitectureViewPage({ view, tabKey, exportFileName }: ArchitectureViewPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedNodeId = searchParams.get('node');

  const selectNode = (id: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (id) next.set('node', id);
    else next.delete('node');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className={styles.page}>
      <DomainTabs current={tabKey} />
      <AppHeader title={view.title} subtitle={view.subtitle} summary={formatViewSummary(buildViewSummary(view))} />
      <ArchitectureCanvas view={view} onSelectNode={selectNode} exportFileName={exportFileName} />
      <DetailDrawer nodes={view.nodes} nodeId={selectedNodeId} onClose={() => selectNode(null)} />
    </div>
  );
}
