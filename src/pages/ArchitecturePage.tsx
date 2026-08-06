import { useSearchParams } from 'react-router-dom';
import { totalArchitectureView } from '@/data/curatedView';
import { AppHeader } from '@/components/shell/AppHeader';
import { ArchitectureCanvas } from '@/components/canvas/ArchitectureCanvas';
import { DetailDrawer } from '@/components/drawer/DetailDrawer';
import styles from './ArchitecturePage.module.css';

export function ArchitecturePage() {
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
      <AppHeader title={totalArchitectureView.title} subtitle={totalArchitectureView.subtitle} />
      <ArchitectureCanvas onSelectNode={selectNode} />
      <DetailDrawer nodeId={selectedNodeId} onClose={() => selectNode(null)} />
    </div>
  );
}
