import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import WelcomePage from "@/pages/WelcomePage";
import Dashboard from "@/pages/Dashboard";
import JobOffers from "@/pages/JobOffers";
import CandidatesList from "@/pages/CandidatesList";
import CandidateDetailsPage from "@/pages/CandidateDetailsPage";
import AIAnalysis from "@/pages/AIAnalysis";
import AIAnalysisDetails from "@/pages/AIAnalysisDetails";
import RankingPage from "@/pages/RankingPage";
import InterviewsPage from "@/pages/InterviewsPage";
import SpontaneousApps from "@/pages/SpontaneousApps";
import Pipeline from "@/pages/Pipeline";
import DecisionsPage from "@/pages/DecisionsPage";
import Notifications from "@/pages/Notifications";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const LegacyCandidateRedirect = () => {
  const { id } = useParams();
  const location = useLocation();
  return <Navigate to={`/candidates/${id}${location.search}`} replace />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<WelcomePage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/jobs" element={<JobOffers />} />
        <Route path="/candidates" element={<CandidatesList />} />
        <Route path="/candidates/:id" element={<CandidateDetailsPage />} />
        <Route path="/candidate/:id" element={<LegacyCandidateRedirect />} />
        <Route path="/ai-analysis" element={<AIAnalysis />} />
        <Route path="/ai-analysis/:id" element={<AIAnalysisDetails />} />
        <Route path="/ranking" element={<RankingPage />} />
        <Route path="/interviews" element={<InterviewsPage />} />
        <Route path="/spontaneous" element={<SpontaneousApps />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/decisions" element={<DecisionsPage />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
