import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { ArchitecturePage } from '@/pages/ArchitecturePage';
import { DomainDeepDivePage } from '@/pages/DomainDeepDivePage';
import { SystemsPage } from '@/pages/SystemsPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { EvidencePage } from '@/pages/EvidencePage';
import { ToFindPage } from '@/pages/ToFindPage';
import { ResearchPage } from '@/pages/ResearchPage';
import { AuthProvider } from '@/auth/AuthContext';
import { SignInPage } from '@/auth/SignInPage';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { StakeholdersPage } from '@/pages/StakeholdersPage';
import { AdminPage } from '@/pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Route path="research" element={<ResearchPage />} />
            <Route path="sign-in" element={<SignInPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="stakeholders" element={<StakeholdersPage />} />
              <Route path="admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/architecture" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
