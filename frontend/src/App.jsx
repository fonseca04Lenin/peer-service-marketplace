import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import ProviderOnboarding from './pages/ProviderOnboarding';

function App() {
  const [page, setPage] = useState('landing');

  if (page === 'main')                return <MainPage />;
  if (page === 'provider-onboarding') return <ProviderOnboarding onFinish={() => setPage('main')} onBack={() => setPage('signup')} />;
  if (page === 'login')               return <LoginPage onLogin={() => setPage('main')} onGoToSignUp={() => setPage('signup')} onBack={() => setPage('landing')} />;
  if (page === 'signup')              return <SignUpPage onSignUp={(role) => setPage(role === 'offer' ? 'provider-onboarding' : 'main')} onGoToLogin={() => setPage('login')} onBack={() => setPage('landing')} />;

  return <LandingPage onSignIn={() => setPage('login')} onGetStarted={() => setPage('signup')} onTestDashboard={() => setPage('main')} />;
}

export default App;
