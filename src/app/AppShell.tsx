import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Scale } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Ga naar hoofdinhoud
      </a>
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <ClipboardCheck className="h-6 w-6 text-primary" aria-hidden="true" />
            <span>Data &amp; AI Team Readiness Scan</span>
          </Link>
          <nav aria-label="Hoofdnavigatie" className="flex items-center gap-4 text-sm">
            <Link to="/" className="rounded-md px-2 py-1.5 hover:bg-muted">
              Sessies
            </Link>
            <Link to="/kalibratie" className="flex items-center gap-1.5 rounded-md px-2 py-1.5 hover:bg-muted">
              <Scale className="h-4 w-4" aria-hidden="true" />
              Beoordelaarskalibratie
            </Link>
          </nav>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="no-print border-t border-border bg-card py-3 text-center text-xs text-muted-foreground">
        Alle gegevens blijven lokaal in deze browser opgeslagen — geen externe servers, geen tracking.
      </footer>
    </div>
  );
}
