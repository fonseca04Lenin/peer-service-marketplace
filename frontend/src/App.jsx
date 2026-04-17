import { useState, useEffect } from 'react';
import { getToken, clearToken, apiFetch } from './api';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';
import ProviderOnboarding from './pages/ProviderOnboarding';

function App() {
  const [page, setPage]   = useState('loading');
  const [user, setUser]   = useState(null);
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0);

  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setPage('landing');
      return;
    }
    apiFetch('/users/me/')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setUser(data);
          setPage('main');
        } else {
          clearToken();
          setPage('landing');
        }
      })
      .catch(() => setPage('landing'));
  }, []);

  function handleLogin(_tok, userData) {
    setUser(userData);
    setPage('main');
  }

  function handleSignUp(_tok, userData) {
    setUser(userData);
    setPage('main');
  }

  function handleLogout() {
    apiFetch('/users/logout/', { method: 'POST' }).catch(() => {});
    clearToken();
    setUser(null);
    setPage('landing');
  }

  if (page === 'loading')             return null;
  if (page === 'provider-onboarding') {
    return (
      <ProviderOnboarding
        onFinish={() => {
          apiFetch('/users/me/')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data) setUser(data); })
            .catch(() => {});
          setServicesRefreshKey((k) => k + 1);
          setPage('main');
        }}
        onBack={() => setPage('main')}
      />
    );
  }
  if (page === 'main') {
    return (
      <AuthProvider user={user}>
        <MainPage
          currentUser={user}
          onLogout={handleLogout}
          onStartOnboarding={() => setPage('provider-onboarding')}
          servicesRefreshKey={servicesRefreshKey}
        />
      </AuthProvider>
    );
  }
  if (page === 'login')               return <LoginPage onLogin={handleLogin} onGoToSignUp={() => setPage('signup')} onBack={() => setPage('landing')} />;
  if (page === 'signup')              return <SignUpPage onSignUp={handleSignUp} onGoToLogin={() => setPage('login')} onBack={() => setPage('landing')} />;

  return <LandingPage onSignIn={() => setPage('login')} onGetStarted={() => setPage('signup')} />;
}

export default App;
