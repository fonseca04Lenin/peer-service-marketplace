import { useState } from 'react';
import { saveToken } from '../api';

function SignUpPage({ onSignUp, onGoToLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    setError('');

    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/users/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const first = Object.values(data)[0];
        setError(Array.isArray(first) ? first[0] : first);
        return;
      }

      saveToken(data.token);
      onSignUp(data.token, data.user);
    } catch {
      setError('Could not connect to server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div className="mc-bg" />

      <nav style={styles.nav}>
        <span onClick={onBack} style={styles.logo}>
          <span style={{ fontWeight: 400 }}>peer</span>
          <span style={{ color: 'rgb(167, 139, 250)' }}>·</span>
          <span style={{ fontWeight: 700 }}>market</span>
        </span>
      </nav>

      <div style={styles.center}>
        <div style={styles.card}>
          <h2 style={styles.title}>Create your account</h2>

          {error && <div style={styles.error}>{error}</div>}

          <label style={styles.label}>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_username"
            style={styles.input}
          />

          <label style={styles.label}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={styles.input}
          />

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={styles.input}
          />

          <button onClick={handleSubmit} disabled={loading} style={styles.button}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <div style={styles.divider}>
            <hr style={styles.hr} />
          </div>

          <p style={styles.switchText}>
            Already have an account?{' '}
            <span style={styles.link} onClick={onGoToLogin}>
              Sign in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Poppins', sans-serif",
  },
  nav: {
    padding: '0 48px',
    height: '60px',
    background: '#0f0620',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  logo: {
    color: 'white',
    fontSize: '20px',
    letterSpacing: '0.5px',
    fontFamily: "'Poppins', sans-serif",
    cursor: 'pointer',
  },
  center: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
    padding: '24px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'white',
    padding: '48px',
    borderRadius: '10px',
    width: '480px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
  },
  title: {
    margin: '0 0 32px 0',
    fontSize: '22px',
    fontWeight: '600',
    color: '#0f0620',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#444',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '20px',
    boxSizing: 'border-box',
    border: '1px solid #dde3ea',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    color: '#0f0620',
    fontFamily: "'Poppins', sans-serif",
  },
  button: {
    width: '100%',
    padding: '13px',
    background: 'rgb(83, 58, 253)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
  },
  divider: {
    margin: '24px 0 20px 0',
  },
  hr: {
    border: 'none',
    borderTop: '1px solid #eee',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
  link: {
    color: 'rgb(83, 58, 253)',
    cursor: 'pointer',
    fontWeight: '600',
  },
  error: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '20px',
  },
};

export default SignUpPage;