import { useState } from 'react';

function LoginPage({ onLogin, onGoToSignUp, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
          <h2 style={styles.title}>Sign in to your account</h2>

          <label style={styles.label}>Email</label>
          <input
            type="email"
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

          <button onClick={onLogin} style={styles.button}>Sign in</button>

          <div style={styles.divider}>
            <hr style={styles.hr} />
          </div>

          <p style={styles.switchText}>
            New to PeerMarket?{' '}
            <span onClick={onGoToSignUp} style={styles.link}>Create account</span>
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
    marginTop: '4px',
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
};

export default LoginPage;
