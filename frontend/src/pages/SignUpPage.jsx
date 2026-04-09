import { useState } from 'react';
import { saveToken } from '../api';
import { COUNTRIES } from '../constants';

function SignUpPage({ onSignUp, onGoToLogin, onBack }) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [username,  setUsername]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [country,   setCountry]   = useState('');
  const [city,      setCity]      = useState('');
  const [error,     setError]     = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleSubmit() {
    setError('');

    if (!firstName || !lastName || !username || !email || !password || !country || !city) {
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
          first_name: firstName,
          last_name:  lastName,
          country,
          city,
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
      <div className="carpentry-bg" />

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

          <div style={styles.nameRow}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Optimus"
                style={styles.input}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Prime"
                style={styles.input}
              />
            </div>
          </div>

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

          <label style={styles.label}>Country</label>
          <select
            value={country}
            onChange={(e) => { setCountry(e.target.value); setCity(''); }}
            style={styles.select}
          >
            <option value="">Select your country</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <label style={styles.label}>City</label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Austin"
            style={styles.input}
            disabled={!country}
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
    padding: '32px 40px',
    borderRadius: '10px',
    width: '480px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
  },
  title: {
    margin: '0 0 18px 0',
    fontSize: '22px',
    fontWeight: '600',
    color: '#0f0620',
  },
  nameRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '0',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#444',
    marginBottom: '5px',
  },
  input: {
    width: '100%',
    padding: '9px 14px',
    marginBottom: '13px',
    boxSizing: 'border-box',
    border: '1px solid #dde3ea',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    color: '#0f0620',
    fontFamily: "'Poppins', sans-serif",
  },
  select: {
    width: '100%',
    padding: '9px 14px',
    marginBottom: '13px',
    boxSizing: 'border-box',
    border: '1px solid #dde3ea',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    color: '#0f0620',
    fontFamily: "'Poppins', sans-serif",
    background: 'white',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  button: {
    width: '100%',
    padding: '11px',
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
    margin: '14px 0 12px 0',
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
