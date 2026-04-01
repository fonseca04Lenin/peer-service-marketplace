function LandingPage({ onSignIn, onGetStarted, onTestDashboard }) {
  return (
    <div style={styles.page}>

      {/* Navigation bar */}
      <nav style={styles.nav}>
        <span style={styles.logo}>
          <span style={{ fontWeight: 400 }}>peer</span>
          <span style={{ color: 'rgb(167, 139, 250)' }}>·</span>
          <span style={{ fontWeight: 700 }}>market</span>
        </span>
        <div style={styles.navRight}>
          <button onClick={onSignIn} style={styles.signInBtn}>Sign in</button>
          <button onClick={onGetStarted} style={styles.getStartedBtn}>Get started →</button>
          <button onClick={onTestDashboard} style={styles.testBtn}>dashboard</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={styles.hero}>

        {/* Left — Minecraft background + text on top */}
        <div style={styles.heroLeft}>
          <div style={styles.overlay}>
            <p style={styles.eyebrow}>Peer-to-peer services, simplified.</p>
            <h1 style={styles.headline}>
              Hire talent.<br />
              <span style={styles.headlineAccent}>Offer your skills.</span>
            </h1>
            <p style={styles.subtext}>
              Connect with trusted peers to get work done — or list your services and start earning today.
            </p>
            <button onClick={onGetStarted} style={styles.ctaBtn}>Get started →</button>
          </div>
        </div>

        {/* Right placeholder */}
        <div style={styles.heroRight}>
          <button onClick={onTestDashboard} style={styles.skipBtn}>test skip</button>
        </div>
      </div>

    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    background: 'white',
    fontFamily: "'Poppins', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 48px',
    height: '60px',
    background: '#0f0620',
    position: 'relative',
    zIndex: 10,
  },
  logo: {
    color: 'white',
    fontSize: '20px',
    letterSpacing: '0.5px',
    fontFamily: "'Poppins', sans-serif",
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  signInBtn: {
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '5px',
    padding: '7px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  testBtn: {
    background: 'transparent',
    color: 'rgba(255,255,255,0.25)',
    border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: '5px',
    padding: '7px 14px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '400',
  },
  getStartedBtn: {
    background: 'rgb(83, 58, 253)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '7px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  hero: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },

  /* Left side  Minecraft as background we cna chnage this later  */
  heroLeft: {
    width: '54%',
    backgroundImage: 'url(/minecraft.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    padding: '80px 48px 80px 80px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    margin: '0 0 20px 0',
    letterSpacing: '0.4px',
  },
  headline: {
    fontSize: '52px',
    fontWeight: '800',
    color: 'white',
    margin: '0 0 24px 0',
    lineHeight: '1.1',
    letterSpacing: '-1px',
  },
  headlineAccent: {
    /*gradient text*/
    background: 'linear-gradient(90deg, #c4b5fd, #a78bfa, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtext: {
    fontSize: '18px',
    background: 'linear-gradient(90deg, #cbd5e1, #a5b4fc, #818cf8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    margin: '0 0 36px 0',
    lineHeight: '1.6',
    maxWidth: '460px',
  },
  ctaBtn: {
    display: 'inline-block',
    background: 'rgb(83, 58, 253)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: 'fit-content',
  },

  heroRight: {
    flex: 1,
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    background: 'transparent',
    color: '#3b82f6',
    border: '1px dashed #3b82f6',
    borderRadius: '6px',
    padding: '10px 20px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
};

export default LandingPage;
