import { useState } from 'react';
import { getToken, clearToken } from './api';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import ProviderOnboarding from './pages/ProviderOnboarding';

function App() {
  const [page, setPage]   = useState('landing');
  const [token, setToken] = useState(() => getToken());
  const [user, setUser]   = useState(null);

  function handleLogin(tok, userData) {
    setToken(tok);
    setUser(userData);
    setPage('main');
  }

  function handleSignUp(tok, userData) {
    setToken(tok);
    setUser(userData);
    setPage(userData.role === 'provider' ? 'provider-onboarding' : 'main');
  }

  function handleLogout() {
    clearToken();
    setToken(null);
    setUser(null);
    setPage('landing');
  }

  if (page === 'main')                return <MainPage currentUser={user} onLogout={handleLogout} />;
  if (page === 'provider-onboarding') return <ProviderOnboarding onFinish={() => setPage('main')} onBack={() => setPage('signup')} />;
  if (page === 'login')               return <LoginPage onLogin={handleLogin} onGoToSignUp={() => setPage('signup')} onBack={() => setPage('landing')} />;
  if (page === 'signup')              return <SignUpPage onSignUp={handleSignUp} onGoToLogin={() => setPage('login')} onBack={() => setPage('landing')} />;

  return <LandingPage onSignIn={() => setPage('login')} onGetStarted={() => setPage('signup')} onTestDashboard={() => setPage('main')} />;
}

export default App;
