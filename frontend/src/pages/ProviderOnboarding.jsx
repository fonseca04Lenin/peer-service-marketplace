import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../api';
import { colors } from '../constants';
import CityAutocomplete from '../components/CityAutocomplete';

function resolveMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

function ProviderOnboarding({ onFinish, onBack }) {
  const [step, setStep] = useState(1);
  const [maxStepVisited, setMaxStepVisited] = useState(1);
  const [done, setDone] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [returningUser, setReturningUser] = useState(false);
  const [existingProfilePictureUrl, setExistingProfilePictureUrl] = useState(null);

  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [tagline, setTagline] = useState('');

  const [bio, setBio] = useState('');

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');

  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceCategory, setServiceCategory] = useState('tech_services');
  const [servicePrice, setServicePrice] = useState('');
  const [rateType, setRateType] = useState('hour');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [serviceAreaLat, setServiceAreaLat] = useState(null);
  const [serviceAreaLng, setServiceAreaLng] = useState(null);
  const [isRemote, setIsRemote] = useState(false);
  const [serviceImage, setServiceImage] = useState(null);
  const [serviceImageFile, setServiceImageFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const photoRef = useRef(null);
  const serviceImageRef = useRef(null);

  useEffect(() => {
    apiFetch('/users/me/')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!data) { setCheckingProfile(false); return; }

        const hasProfile = data.bio || data.tagline || data.skills;
        if (hasProfile) setReturningUser(true);

        if (data.profile_picture) {
          const url = resolveMediaUrl(data.profile_picture);
          setExistingProfilePictureUrl(url);
          setPhoto(url);
        }
        setCheckingProfile(false);
      })
      .catch(() => setCheckingProfile(false));
  }, []);

  useEffect(() => () => {
    if (photo && photo.startsWith('blob:')) URL.revokeObjectURL(photo);
    if (serviceImage && serviceImage.startsWith('blob:')) URL.revokeObjectURL(serviceImage);
  }, [photo, serviceImage]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setSaveError("Profile photo must be under 5 MB.");
      return;
    }
    if (photo && photo.startsWith('blob:')) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setPhotoFile(file);
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

  const goToStep = (n) => {
    if (n < 1 || n > 4 || n > maxStepVisited) return;
    setStep(n);
    setSaveError('');
  };

  const goBack = () => (step === 1 ? onBack() : setStep(step - 1));

  async function handleFinish() {
    setSaving(true);
    setSaveError('');
    try {
      const profileData = photoFile ? (() => {
        const fd = new FormData();
        fd.append('profile_picture', photoFile);
        fd.append('bio', bio);
        fd.append('tagline', tagline);
        fd.append('skills', skills.join(','));
        return fd;
      })() : JSON.stringify({ bio, tagline, skills: skills.join(',') });

      const profileRes = await apiFetch('/users/me/', { method: 'PATCH', body: profileData });
      if (!profileRes.ok) {
        const err = await profileRes.json();
        const msg = Object.values(err)[0];
        throw new Error(Array.isArray(msg) ? msg[0] : String(msg));
      }

      const svcData = new FormData();
      svcData.append('title', serviceTitle.trim());
      svcData.append('description', serviceDesc.trim());
      svcData.append('category', serviceCategory);
      svcData.append('price', String(parseFloat(servicePrice)));
      svcData.append('rate_type', rateType);
      svcData.append('is_remote', isRemote);
      svcData.append('service_area', isRemote ? '' : serviceArea.trim());
      if (!isRemote && serviceAreaLat != null) svcData.append('latitude', serviceAreaLat);
      if (!isRemote && serviceAreaLng != null) svcData.append('longitude', serviceAreaLng);
      svcData.append('image', serviceImageFile);
      const svcRes = await apiFetch('/services/create/', { method: 'POST', body: svcData });
      if (!svcRes.ok) {
        const err = await svcRes.json().catch(() => ({}));
        const first = Object.values(err)[0];
        const msg = Array.isArray(first) ? first[0] : typeof first === 'object' && first !== null
          ? JSON.stringify(first)
          : String(first || svcRes.statusText || 'Could not create service.');
        throw new Error(msg);
      }

      setDone(true);
    } catch (e) {
      setSaveError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const goNext = () => {
    setSaveError('');
    if (step === 1) {
      if (!photoFile && !existingProfilePictureUrl) {
        setSaveError('A profile photo is required.');
        return;
      }
      if (!tagline.trim()) {
        setSaveError('Please enter a tagline.');
        return;
      }
      setMaxStepVisited((prev) => Math.max(prev, 2));
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!bio.trim()) {
        setSaveError('Please enter your bio.');
        return;
      }
      setMaxStepVisited((prev) => Math.max(prev, 3));
      setStep(3);
      return;
    }
    if (step === 3) {
      if (skills.length === 0) {
        setSaveError('Add at least one skill.');
        return;
      }
      setMaxStepVisited((prev) => Math.max(prev, 4));
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!serviceTitle.trim()) {
        setSaveError('Please enter a service title.');
        return;
      }
      const priceNum = parseFloat(servicePrice);
      if (servicePrice.trim() === '' || Number.isNaN(priceNum) || priceNum < 0) {
        setSaveError('Please enter a valid price (0 or more).');
        return;
      }
      if (!serviceDesc.trim()) {
        setSaveError('Please enter a description for your service.');
        return;
      }
      if (!isRemote && !serviceArea.trim()) {
        setSaveError('Enter a city, or mark the service as remote.');
        return;
      }
      if (!serviceImageFile) {
        setSaveError('Please upload a service photo.');
        return;
      }
      handleFinish();
    }
  };

  const stepLabels = ['Profile', 'About', 'Skills', 'Service'];

  if (checkingProfile) {
    return (
      <div style={styles.page}>
        <div className="market-bg" />
        <nav style={styles.nav}>
          <span style={styles.logo}>
            <span style={{ fontWeight: 400 }}>peer</span>
            <span style={{ color: 'rgb(167, 139, 250)' }}>·</span>
            <span style={{ fontWeight: 700 }}>market</span>
          </span>
        </nav>
        <div style={{ ...styles.scroll, justifyContent: 'center' }}>
          <p style={{ color: 'white', fontSize: '14px', opacity: 0.7 }}>Loading your profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div className="market-bg" />

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
              <div style={styles.stepsWrap}>
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const isActive = step === n;
                  const isPast = n < step;
                  const isReachableFuture = n > step && n <= maxStepVisited;
                  const lineLeftDone = n > 1 && maxStepVisited >= n;
                  const lineRightDone = n < stepLabels.length && maxStepVisited > n;
                  const clickable = n <= maxStepVisited && n !== step;
                  const circleStyle = {
                    ...styles.stepCircle,
                    background: isPast ? colors.purple : 'white',
                    border: isPast
                      ? 'none'
                      : isActive
                        ? `2px solid ${colors.purple}`
                        : isReachableFuture
                          ? `2px solid ${colors.purple}`
                          : '2px solid #dde3ea',
                    color: isPast ? 'white' : isActive ? colors.purple : isReachableFuture ? colors.purple : colors.muted,
                    cursor: clickable ? 'pointer' : 'default',
                  };
                  return (
                    <div key={n} style={styles.stepItem}>
                      {i > 0 && (
                        <div style={{
                          ...styles.stepLine,
                          background: lineLeftDone ? colors.purple : '#e2e8f0',
                        }} />
                      )}
                      <button
                        type="button"
                        onClick={() => clickable && goToStep(n)}
                        style={{
                          ...circleStyle,
                          padding: 0,
                          margin: 0,
                          font: 'inherit',
                        }}
                        aria-label={`Go to step ${n}: ${label}`}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        {isPast ? '✓' : n}
                      </button>
                      {i < stepLabels.length - 1 && (
                        <div style={{
                          ...styles.stepLine,
                          background: lineRightDone ? colors.purple : '#e2e8f0',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={styles.stepLabelRow}>
                {stepLabels.map((label, i) => {
                  const n = i + 1;
                  const clickable = n <= maxStepVisited && n !== step;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => clickable && goToStep(n)}
                      style={{
                        ...styles.stepLabel,
                        ...styles.stepLabelBtn,
                        color: step === n ? colors.dark : colors.muted,
                        fontWeight: step === n ? '600' : '400',
                        cursor: clickable ? 'pointer' : 'default',
                        opacity: clickable ? 1 : step === n ? 1 : 0.85,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {step === 1 && (
                <div>
                  <h2 style={styles.stepTitle}>Set up your profile</h2>
                  <p style={styles.stepSub}>This is what people see first. Make it count.</p>

                  <label style={styles.label}>Profile photo <span style={{ color: 'red' }}>*</span></label>
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

                  <label style={styles.label}>Tagline <span style={{ color: 'red' }}>*</span></label>
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

                  <label style={styles.label}>Bio <span style={{ color: 'red' }}>*</span></label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell people who you are, your background, and what drives you..."
                    style={styles.textarea}
                    rows={5}
                  />

                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 style={styles.stepTitle}>Your skills</h2>
                  <p style={styles.stepSub}>Be specific — "Python" lands better than "coding".</p>

                  <label style={styles.label}>Skills <span style={{ color: 'red' }}>*</span></label>
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
                  <h2 style={styles.stepTitle}>{returningUser ? 'Add a new listing' : 'Your first listing'}</h2>
                  <p style={styles.stepSub}>
                    {returningUser
                      ? <>Profile already on file — use the steps above to edit earlier sections.</>
                      : 'You can always come back and edit this later.'
                    }
                  </p>

                  <label style={styles.label}>Service title <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={serviceTitle}
                    onChange={(e) => setServiceTitle(e.target.value)}
                    placeholder="e.g. Algebra tutoring for high schoolers"
                    style={styles.input}
                  />

                  <label style={styles.label}>Category <span style={{ color: 'red' }}>*</span></label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="tech_services">Tech Services</option>
                    <option value="creative_services">Creative Services</option>
                    <option value="home_services">Home Services</option>
                    <option value="education">Education</option>
                    <option value="health_wellness">Health & Wellness</option>
                    <option value="financial_services">Financial Services</option>
                    <option value="business_services">Business Services</option>
                    <option value="other">Other</option>
                  </select>

                  <label style={styles.label}>Rate <span style={{ color: 'red' }}>*</span></label>
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

                  <label style={styles.label}>Description <span style={{ color: 'red' }}>*</span></label>
                  <textarea
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    placeholder="Describe what you offer, who it's for, and what makes you the right pick..."
                    style={styles.textarea}
                    rows={4}
                  />

                  <label style={styles.label}>Location</label>
                  <div style={styles.remoteRow}>
                    <button
                      type="button"
                      onClick={() => setIsRemote(false)}
                      style={{ ...(isRemote ? styles.rateBtn : styles.rateActive), flex: 1, padding: '10px', borderLeft: 'none' }}
                    >
                      In person
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRemote(true)}
                      style={{ ...(isRemote ? styles.rateActive : styles.rateBtn), flex: 1, padding: '10px' }}
                    >
                      Remote
                    </button>
                  </div>

                  {!isRemote && (
                    <>
                      <label style={styles.label}>City <span style={{ color: 'red' }}>*</span></label>
                      <div style={{ marginBottom: '20px' }}>
                        <CityAutocomplete
                          value={serviceArea}
                          onSelect={(city, lat, lng) => {
                            setServiceArea(city);
                            setServiceAreaLat(lat);
                            setServiceAreaLng(lng);
                          }}
                          placeholder="Search for a city…"
                          inputStyle={{ ...styles.input, marginBottom: 0 }}
                        />
                      </div>
                    </>
                  )}

                  <label style={styles.label}>Service photo <span style={{ color: 'red' }}>*</span></label>
                  <div
                    style={styles.serviceImageBox}
                    onClick={() => serviceImageRef.current.click()}
                  >
                    {serviceImage ? (
                      <img src={serviceImage} alt="service" style={styles.serviceImagePreview} />
                    ) : (
                      <div style={styles.serviceImageEmpty}>
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#ccc" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 20.25h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12.75c0 .828.672 1.5 1.5 1.5z" />
                        </svg>
                        <span style={{ fontSize: '12px', color: '#bbb', marginTop: '8px' }}>Click to upload a photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={serviceImageRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      if (file.size > MAX_FILE_SIZE) {
                        setSaveError("Service photo must be under 5 MB.");
                        return;
                      }
                      setServiceImage(URL.createObjectURL(file));
                      setServiceImageFile(file);
                    }}
                  />

                </div>
              )}

              {saveError && <p style={{ color: 'red', fontSize: '13px', marginTop: '12px' }}>{saveError}</p>}
              <div style={styles.navRow}>
                <button onClick={goBack} style={styles.backBtn}>
                  ← Back
                </button>
                <button onClick={goNext} disabled={saving} style={styles.continueBtn}>
                  {step === 4 ? (saving ? 'Saving...' : 'Finish setup') : 'Continue →'}
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
    background: colors.dark,
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
    borderRadius: '4px',
    width: '560px',
    boxShadow: '0 8px 48px rgba(0,0,0,0.28)',
    marginBottom: '24px',
  },

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
    borderRadius: '4px',
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
  stepLabelBtn: {
    background: 'none',
    border: 'none',
    padding: '2px 4px',
    borderRadius: '4px',
    fontFamily: "'Poppins', sans-serif",
  },

  stepTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: colors.dark,
    margin: '0 0 8px 0',
  },
  stepSub: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 32px 0',
    lineHeight: '1.5',
  },

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
    color: colors.purple,
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
    borderRadius: '4px',
    fontSize: '15px',
    outline: 'none',
    color: colors.dark,
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
    borderRadius: '4px',
    fontSize: '15px',
    outline: 'none',
    color: colors.dark,
    fontFamily: "'Poppins', sans-serif",
    resize: 'vertical',
    lineHeight: '1.6',
  },

  tagsBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    border: '1px solid #dde3ea',
    borderRadius: '4px',
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
    background: colors.purpleSoft,
    color: colors.purple,
    border: '1px solid #d4c8ff',
    borderRadius: 0,
    padding: '4px 10px 4px 12px',
    fontSize: '13px',
    fontWeight: '500',
  },
  tagX: {
    background: 'none',
    border: 'none',
    color: colors.purple,
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
    color: colors.dark,
    flex: 1,
    minWidth: '120px',
  },
  hint: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '4px',
  },
  serviceImageBox: {
    width: '100%',
    height: '160px',
    border: '2px dashed #dde3ea',
    borderRadius: '4px',
    cursor: 'pointer',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fafafa',
    marginBottom: '20px',
  },
  serviceImageEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceImagePreview: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    marginBottom: '20px',
    border: '1px solid #dde3ea',
    borderRadius: '4px',
    fontSize: '15px',
    outline: 'none',
    color: colors.dark,
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
    borderRadius: '4px',
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
    color: colors.dark,
  },
  remoteRow: {
    display: 'flex',
    border: '1px solid #dde3ea',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '20px',
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
    background: colors.purpleSoft,
    border: 'none',
    borderLeft: '1px solid #dde3ea',
    cursor: 'pointer',
    fontSize: '13px',
    color: colors.purple,
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
    height: '100%',
  },

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
    background: colors.purple,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Poppins', sans-serif",
  },

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
    borderRadius: '4px',
    background: colors.purpleSoft,
    color: colors.purple,
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
    color: colors.dark,
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
