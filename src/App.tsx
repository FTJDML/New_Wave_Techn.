import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { ArchitecturePage } from '@/pages/ArchitecturePage';
import { DomainDeepDivePage } from '@/pages/DomainDeepDivePage';
import { SystemsPage } from '@/pages/SystemsPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ToFindPage } from '@/pages/ToFindPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/architecture" replace />} />
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="architecture/:domain" element={<DomainDeepDivePage />} />
          <Route path="systems" element={<SystemsPage />} />
          <Route path="systems/:componentId" element={<SystemsPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:vendorId" element={<SuppliersPage />} />
          <Route path="evidence" element={<EvidencePage />} />
          <Route path="evidence/:sourceId" element={<EvidencePage />} />
          <Route path="to-find" element={<ToFindPage />} />
          <Route path="to-find/:gapId" element={<ToFindPage />} />
          <Route path="*" element={<Navigate to="/architecture" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
