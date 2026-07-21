import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./app/AppShell";
import { HomePage } from "@/features/session/HomePage";
import { OnboardingScreen } from "@/features/session/OnboardingScreen";
import { NewSessionPage } from "@/features/session/NewSessionPage";
import { SessionProvider } from "@/features/session/SessionProvider";
import { InterviewPage } from "@/features/interview/InterviewPage";
import { IndividualResultsPage } from "@/features/results/IndividualResultsPage";
import { TeamResultsPage } from "@/features/team/TeamResultsPage";
import { CalibrationPage } from "@/features/calibration/CalibrationPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
        <Route path="/sessions/new" element={<NewSessionPage />} />
        <Route
          path="/sessions/:sessionId/*"
          element={
            <SessionProvider>
              <Routes>
                <Route path="interview" element={<InterviewPage />} />
                <Route path="results/:participantId" element={<IndividualResultsPage />} />
                <Route path="team" element={<TeamResultsPage />} />
                <Route path="*" element={<Navigate to="interview" replace />} />
              </Routes>
            </SessionProvider>
          }
        />
        <Route path="/kalibratie" element={<CalibrationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
