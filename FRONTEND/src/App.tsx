import AppLayout from './components/layout/AppLayout';

import { useAppPath } from './router/appRouter';

import Dashboard from './pages/dashboard/Dashboard';
import GithubWorkspace from './pages/github/GithubWorkspace';
import Skills from './pages/skills/Skills';
import AnalysisHistory from './pages/analysis/AnalysisHistory';
import Analysis from './pages/analysis/Analysis';
import JobProfiles from './pages/job-profiles/JobProfiles';
import JobRecommendations from './pages/job-recommendations/JobRecommendations';
import Settings from './pages/settings/Settings';
import Help from './pages/help/Help';

import LandingPage from './pages/landing/LandingPage';
import RegisterPage from './pages/register/RegisterPage';
import LoginPage from './pages/login/LoginPage';
import ForgotPasswordPage from './pages/login/ForgotPasswordPage';

function RouteView() {
  const path = useAppPath();

  if (path === '/github') {
    return <GithubWorkspace />;
  }

  if (path === '/skills' || path.startsWith('/skills/')) {
    return <Skills />;
  }

  if (path === '/analysis') {
    return <AnalysisHistory />;
  }

  if (path.startsWith('/analysis/')) {
    const analysisRunId = decodeURIComponent(
      path.slice('/analysis/'.length),
    );

    return <Analysis analysisRunId={analysisRunId} />;
  }

  if (path.startsWith('/job-profiles/')) {
    const profileSlug = decodeURIComponent(
      path.slice('/job-profiles/'.length),
    );

    return <JobProfiles profileSlug={profileSlug} />;
  }

  if (path === '/job-profiles') {
    return <JobProfiles />;
  }

  if (path.startsWith('/job-recommendations/')) {
    const profileSlug = decodeURIComponent(
      path.slice('/job-recommendations/'.length),
    );

    return <JobRecommendations jobProfileSlug={profileSlug} />;
  }

  if (path === '/job-recommendations') {
    return <JobRecommendations />;
  }

  if (path === '/settings' || path.startsWith('/settings/')) {
    return <Settings />;
  }

  if (path === '/help' || path.startsWith('/help/')) {
    return <Help />;
  }

  return <Dashboard />;
}

export default function App() {
  const path = useAppPath();

  /*
   * PUBLIC ROUTES
   */

  if (path === '/') {
    return (
      <div className="sc-page-background">
        <LandingPage />
      </div>
    );
  }

  if (path === '/landing') {
    return (
      <div className="sc-page-background">
        <LandingPage />
      </div>
    );
  }

  if (path === '/login') {
    return (
      <div className="sc-page-background">
        <LoginPage />
      </div>
    );
  }

  if (path === '/register') {
    return (
      <div className="sc-page-background">
        <RegisterPage />
      </div>
    );
  }

  if (path === '/forgot-password') {
    return (
      <div className="sc-page-background">
        <ForgotPasswordPage />
      </div>
    );
  }

  /*
   * AUTHENTICATED APPLICATION
   */

  return (
    <div className="sc-page-background">
      <AppLayout>
        <RouteView />
      </AppLayout>
    </div>
  );
}