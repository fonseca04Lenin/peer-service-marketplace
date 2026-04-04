import { useState } from 'react';

const hirePerks = [
  { title: 'Real people, real skills', desc: 'Every provider is a peer. You know exactly who you\'re working with before you book.' },
  { title: 'Book in a few clicks', desc: 'Find someone, check their availability, and lock in a time. Simple as that.' },
  { title: 'Leave a review', desc: 'After each job, rate your experience. It keeps the community honest and helps others.' },
];

const offerPerks = [
  { title: 'Turn your skills into income', desc: 'Good at tutoring, design, music? List it and start getting booked by people near you.' },
  { title: 'You set the terms', desc: 'Your schedule, your rate. You decide what you take on and when.' },
  { title: 'Build a reputation', desc: 'Good reviews stick around. The better your work, the more bookings come your way.' },
];

function LandingPage({ onSignIn, onGetStarted }) {
  const [selected, setSelected] = useState('hire');

  const perks = selected === 'hire' ? hirePerks : offerPerks;

  return (
    <div style={styles.page}>

      <nav style={styles.nav}>
        <span style={styles.logo}>
          <span style={{ fontWeight: 400 }}>peer</span>
          <span style={{ color: 'rgb(167, 139, 250)' }}>·</span>
          <span style={{ fontWeight: 700 }}>market</span>
        </span>
        <div style={styles.navRight}>
          <button onClick={onSignIn} style={styles.signInBtn}>Sign in</button>
          <button onClick={onGetStarted} style={styles.getStartedBtn}>Get started →</button>
        </div>
      </nav>

      <div style={styles.hero}>

        <div style={styles.heroBg} />
        <div style={styles.darkOverlay} />

        <div style={styles.heroLeft}>
          <p style={styles.eyebrow}>Peer-to-peer services, simplified.</p>
          <h1 style={styles.headline}>
            Hire talent.<br />
            <span style={styles.headlineAccent}>Offer your skills.</span>
          </h1>
          <p style={styles.subtext}>
            Connect with trusted peers to get work done or list your services and start earning today.
          </p>
        </div>

        <div style={styles.heroRight}>
          <div style={styles.rightInner}>

            <div style={styles.optionRow}>
              <button
                onClick={() => setSelected('hire')}
                style={{ ...styles.optionCard, ...(selected === 'hire' ? styles.optionCardActive : {}) }}
              >
                <p style={styles.optionTitle}>Hire somebody</p>
              </button>

              <button
                onClick={() => setSelected('offer')}
                style={{ ...styles.optionCard, ...(selected === 'offer' ? styles.optionCardActive : {}) }}
              >
                <p style={styles.optionTitle}>Offer your services</p>
              </button>
            </div>

            <div style={styles.perkList}>
              {perks.map((perk) => (
                <div key={perk.title} style={styles.perkCard}>
                  <p style={styles.perkTitle}>{perk.title}</p>
                  <p style={styles.perkDesc}>{perk.desc}</p>
                </div>
              ))}
              <button onClick={onGetStarted} style={styles.goBtn}>
                {selected === 'hire' ? 'Find someone →' : 'Start offering →'}
              </button>
            </div>

          </div>
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
    position: 'relative',
  },
  heroBg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/minecraft.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  darkOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1,
  },

  heroLeft: {
    position: 'relative',
    zIndex: 2,
    width: '54%',
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
    position: 'relative',
    zIndex: 2,
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 40px',
    overflowY: 'auto',
  },
  rightInner: {
    width: '100%',
    maxWidth: '480px',
  },
  optionRow: {
    display: 'flex',
    gap: '14px',
    marginBottom: '24px',
  },
  optionCard: {
    flex: 1,
    background: 'rgba(255,255,255,0.12)',
    border: '1.5px solid rgba(255,255,255,0.2)',
    borderRadius: '4px',
    padding: '14px 20px',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: "'Poppins', sans-serif",
  },
  optionCardActive: {
    background: 'rgb(83, 58, 253)',
    border: '1.5px solid rgb(83, 58, 253)',
  },
  optionTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: 'white',
    margin: 0,
  },
  perkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  perkCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    padding: '18px 22px',
  },
  perkTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111',
    margin: '0 0 5px 0',
  },
  perkDesc: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.55',
  },
  goBtn: {
    marginTop: '6px',
    background: 'rgb(83, 58, 253)',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '13px 24px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    alignSelf: 'flex-start',
  },
};

export default LandingPage;
