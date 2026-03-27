import { useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import MainPage from './pages/MainPage';

function App() {
  const [page, setPage] = useState('landing');

  if (page === 'main')    return <MainPage />;
  if (page === 'login')   return <LoginPage  onLogin={() => setPage('main')} onGoToSignUp={() => setPage('signup')} onBack={() => setPage('landing')} />;
  if (page === 'signup')  return <SignUpPage onSignUp={() => setPage('main')} onGoToLogin={() => setPage('login')}  onBack={() => setPage('landing')} />;

  return <LandingPage onSignIn={() => setPage('login')} onGetStarted={() => setPage('signup')} />;
}

export default App;
