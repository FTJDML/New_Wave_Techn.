import { useState } from 'react';
import { totalArchitectureView } from '@/data/curatedView';
import { AppHeader } from '@/components/shell/AppHeader';
import { ArchitectureCanvas } from '@/components/canvas/ArchitectureCanvas';
import { DetailDrawer } from '@/components/drawer/DetailDrawer';
import styles from './ArchitecturePage.module.css';

export function ArchitecturePage() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className={styles.page}>
      <AppHeader title={totalArchitectureView.title} subtitle={totalArchitectureView.subtitle} />
      <ArchitectureCanvas onSelectNode={setSelectedNodeId} />
      <DetailDrawer nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} />
    </div>
  );
}
