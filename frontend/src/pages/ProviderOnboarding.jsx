import { useState, useRef } from 'react';

function ProviderOnboarding({ onFinish, onBack }) {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

  const [photo, setPhoto] = useState(null);
  const [tagline, setTagline] = useState('');

  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('tutoring');
  const [servicePrice, setServicePrice] = useState('');
  const [rateType, setRateType] = useState('hour');
  const [serviceDesc, setServiceDesc] = useState('');

  const photoRef = useRef(null);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  const handleSkillKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const val = skillInput.trim().replace(/,/g, '');
      if (val && !skills.includes(val)) setSkills([...skills, val]);
      setSkillInput('');
    }
  };

  const removeSkill = (s) => setSkills(skills.filter(x => x !== s));

  const goBack = () => step === 1 ? onBack() : setStep(step - 1);
  const goNext = () => step === 4 ? setDone(true) : setStep(step + 1);

  const stepLabels = ['Profile', 'About', 'Skills', 'Service'];

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

      <div style={styles.scroll}>
        <div style={styles.card}>

          {done ? (
            <div style={styles.doneWrap}>
              <div style={styles.doneCheck}>✓</div>
              <h2 style={styles.doneTitle}>You're all set.</h2>
              <p style={styles.doneSub}>
                Your provider profile is ready. Start browsing requests or manage your listings from your dashboard.
              </p>
              <button onClick={onFinish} style={{ ...styles.continueBtn, width: '100%' }}>
                Go to your dashboard →
              </button>
            </div>
          ) : (
            <>
              {/* step progress */}
              <div style={styles.stepsWrap}>
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const isActive = step === n;
                  const isPast = step > n;
                  return (
                    <div key={n} style={styles.stepItem}>
                      {i > 0 && (
                        <div style={{
                          ...styles.stepLine,
                          background: isPast || isActive ? 'rgb(83, 58, 253)' : '#e2e8f0',
                        }} />
                      )}
                      <div style={{
                        ...styles.stepCircle,
                        background: isPast ? 'rgb(83, 58, 253)' : 'white',
                        border: isPast ? 'none' : isActive ? '2px solid rgb(83, 58, 253)' : '2px solid #dde3ea',
                        color: isPast ? 'white' : isActive ? 'rgb(83, 58, 253)' : '#bbb',
                      }}>
                        {isPast ? '✓' : n}
                      </div>
                      {i < stepLabels.length - 1 && (
                        <div style={{
                          ...styles.stepLine,
                          background: isPast ? 'rgb(83, 58, 253)' : '#e2e8f0',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={styles.stepLabelRow}>
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  return (
                    <span key={n} style={{
                      ...styles.stepLabel,
                      color: step === n ? '#0f0620' : '#bbb',
                      fontWeight: step === n ? '600' : '400',
                    }}>
                      {label}
                    </span>
                  );
                })}
              </div>

              {step === 1 && (
                <div>
                  <h2 style={styles.stepTitle}>Set up your profile</h2>
                  <p style={styles.stepSub}>This is what people see first. Make it count.</p>

                  <div style={styles.photoWrap}>
                    <div style={styles.photoCircle} onClick={() => photoRef.current.click()}>
                      {photo ? (
                        <img src={photo} alt="profile" style={styles.photoImg} />
                      ) : (
                        <div style={styles.photoEmpty}>
                          <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#ccc" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                          </svg>
                          <span style={{ fontSize: '11px', color: '#bbb', marginTop: '6px' }}>Add photo</span>
                        </div>
                      )}
                    </div>
                    <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
                    {photo && (
                      <button onClick={() => photoRef.current.click()} style={styles.changePhotoBtn}>
                        Change photo
                      </button>
                    )}
                  </div>

                  <label style={styles.label}>Tagline</label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value.slice(0, 80))}
                    placeholder="e.g. Full-stack dev open to freelance work"
                    style={styles.input}
                  />
                  <span style={styles.charCount}>{tagline.length} / 80</span>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 style={styles.stepTitle}>Tell your story</h2>
                  <p style={styles.stepSub}>A little context goes a long way with clients.</p>

                  <label style={styles.label}>Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people who you are, your background, and what drives you..."
                    style={styles.textarea}
                    rows={5}
                  />

                  <label style={styles.label}>
                    Location{' '}
                    <span style={styles.optional}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City, State"
                    style={styles.input}
                  />
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 style={styles.stepTitle}>Your skills</h2>
                  <p style={styles.stepSub}>Be specific — "Python" lands better than "coding".</p>

                  <label style={styles.label}>Skills</label>
                  <div style={styles.tagsBox}>
                    {skills.map(s => (
                      <span key={s} style={styles.tag}>
                        {s}
                        <button onClick={() => removeSkill(s)} style={styles.tagX}>×</button>
                      </span>
                    ))}
                    <input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleSkillKey}
                      placeholder={skills.length === 0 ? 'Type a skill and press Enter' : 'Add another...'}
                      style={styles.tagInput}
                    />
                  </div>
                  <p style={styles.hint}>Press Enter or comma after each skill</p>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 style={styles.stepTitle}>Your first listing</h2>
                  <p style={styles.stepSub}>You can always come back and edit this later.</p>

                  <label style={styles.label}>Service title</label>
                  <input
                    type="text"
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    placeholder="e.g. Algebra tutoring for high schoolers"
                    style={styles.input}
                  />

                  <label style={styles.label}>Category</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="tutoring">Tutoring</option>
                    <option value="handyman">Handyman</option>
                    <option value="tech">Tech Help</option>
                    <option value="creative">Creative Work</option>
                    <option value="home">Home Care</option>
                    <option value="other">Other</option>
                  </select>

                  <label style={styles.label}>Rate</label>
                  <div style={styles.priceRow}>
                    <span style={styles.dollarSign}>$</span>
                    <input
                      type="number"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      placeholder="0"
                      min="0"
                      style={styles.priceInput}
                    />
                    <div style={styles.rateToggle}>
                      <button
                        onClick={() => setRateType('hour')}
                        style={rateType === 'hour' ? styles.rateActive : styles.rateBtn}
                      >
                        / hr
                      </button>
                      <button
                        onClick={() => setRateType('flat')}
                        style={rateType === 'flat' ? styles.rateActive : styles.rateBtn}
                      >
                        flat
                      </button>
                    </div>
                  </div>

                  <label style={styles.label}>Description</label>
                  <textarea
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    placeholder="Describe what you offer, who it's for, and what makes you the right pick..."
                    style={styles.textarea}
                    rows={4}
                  />
                </div>
              )}

              <div style={styles.navRow}>
                <button onClick={goBack} style={styles.backBtn}>
                  {step === 1 ? '← Back to signup' : '← Back'}
                </button>
                <button onClick={goNext} style={styles.continueBtn}>
                  {step === 4 ? 'Finish setup' : 'Continue →'}
                </button>
              </div>
            </>
          )}

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
  scroll: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 24px',
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'white',
    padding: '52px',
    borderRadius: '12px',
    width: '560px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.28)',
    marginBottom: '24px',
  },

  /* step indicator */
  stepsWrap: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  stepItem: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
    minWidth: 20,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
    zIndex: 1,
  },
  stepLabelRow: {
    display: 'flex',
    marginBottom: '40px',
  },
  stepLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: '11px',
    letterSpacing: '0.2px',
  },

  /* step content */
  stepTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f0620',
    margin: '0 0 8px 0',
  },
  stepSub: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 32px 0',
    lineHeight: '1.5',
  },

  /* photo upload */
  photoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '28px',
  },
  photoCircle: {
    width: 100,
    height: 100,
    borderRadius: '50%',
    border: '2px dashed #dde3ea',
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
  },
  photoEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  changePhotoBtn: {
    background: 'none',
    border: 'none',
    color: 'rgb(83, 58, 253)',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    marginTop: '10px',
    padding: 0,
  },

  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#444',
    marginBottom: '8px',
  },
  optional: {
    fontSize: '12px',
    color: '#aaa',
    fontWeight: '400',
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
  charCount: {
    display: 'block',
    textAlign: 'right',
    fontSize: '12px',
    color: '#bbb',
    marginTop: '-14px',
    marginBottom: '16px',
  },
  textarea: {
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
    resize: 'vertical',
    lineHeight: '1.6',
  },

  /* skill tags */
  tagsBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    border: '1px solid #dde3ea',
    borderRadius: '6px',
    padding: '10px',
    minHeight: '52px',
    alignItems: 'center',
    marginBottom: '8px',
    cursor: 'text',
  },
  tag: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#f0eeff',
    color: 'rgb(83, 58, 253)',
    border: '1px solid #d4c8ff',
    borderRadius: '20px',
    padding: '4px 10px 4px 12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  tagX: {
    background: 'none',
    border: 'none',
    color: 'rgb(83, 58, 253)',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '1',
    padding: 0,
    opacity: '0.6',
    fontFamily: "'Poppins', sans-serif",
  },
  tagInput: {
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    fontFamily: "'Poppins', sans-serif",
    color: '#0f0620',
    flex: 1,
    minWidth: '120px',
  },
  hint: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '4px',
  },

  /* service listing */
  select: {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '20px',
    border: '1px solid #dde3ea',
    borderRadius: '6px',
    fontSize: '15px',
    outline: 'none',
    color: '#0f0620',
    fontFamily: "'Poppins', sans-serif",
    background: 'white',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  priceRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '20px',
    border: '1px solid #dde3ea',
    borderRadius: '6px',
    paddingLeft: '14px',
    overflow: 'hidden',
  },
  dollarSign: {
    color: '#555',
    fontSize: '15px',
    fontWeight: '500',
  },
  priceInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    padding: '12px 8px',
    fontFamily: "'Poppins', sans-serif",
    color: '#0f0620',
  },
  rateToggle: {
    display: 'flex',
    borderLeft: '1px solid #dde3ea',
  },
  rateBtn: {
    padding: '0 14px',
    background: 'white',
    border: 'none',
    borderLeft: '1px solid #dde3ea',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#888',
    fontFamily: "'Poppins', sans-serif",
    height: '100%',
  },
  rateActive: {
    padding: '0 14px',
    background: '#f0eeff',
    border: 'none',
    borderLeft: '1px solid #dde3ea',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'rgb(83, 58, 253)',
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
    height: '100%',
  },

  /* nav buttons */
  navRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#888',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: '500',
    padding: 0,
  },
  continueBtn: {
    padding: '13px 28px',
    background: 'rgb(83, 58, 253)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
  },

  /* done screen */
  doneWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '20px 0',
  },
  doneCheck: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#f0eeff',
    color: 'rgb(83, 58, 253)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    fontWeight: '700',
    marginBottom: '24px',
  },
  doneTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f0620',
    marginBottom: '12px',
  },
  doneSub: {
    fontSize: '15px',
    color: '#666',
    lineHeight: '1.6',
    maxWidth: '360px',
    marginBottom: '36px',
  },
};

export default ProviderOnboarding;
