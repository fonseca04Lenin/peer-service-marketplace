import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import MainPage from './pages/MainPage';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (loggedIn) {
    return <MainPage />;
  }

  return <LoginPage onLogin={() => setLoggedIn(true)} />;
}

export default App;
