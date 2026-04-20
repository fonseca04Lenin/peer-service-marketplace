import { useState, useRef, useEffect, useCallback } from 'react';
import SearchPage from './SearchPage';
import ServicePage from './ServicePage';
import AccountPage from './AccountPage';
import Dashboard from './Dashboard';
import BookingsPage from './BookingsPage';
import MessagesPage from './MessagesPage';
import ReviewsPage from './ReviewsPage';
import SettingsPage from './SettingsPage';
import PaymentPage from './PaymentPage';
import WalletPage from './WalletPage';
import { colors } from '../constants';
import { apiFetch } from '../api';

const navItems = [
  { label: 'Dashboard', key: 'Dashboard' },
  { label: 'Explore',   key: 'Search Services' },
  { label: 'Bookings',  key: 'Bookings' },
  { label: 'Messages',  key: 'Messages' },
  { label: 'Reviews',   key: 'Reviews' },
];

function MainPage({ currentUser, onLogout, onStartOnboarding, servicesRefreshKey = 0 }) {
  const [active, setActive]                       = useState('Dashboard');
  const [selectedServiceID, setSelectedServiceID] = useState(null);
  const [payingBooking, setPayingBooking]         = useState(null);
  const [menuOpen, setMenuOpen]                   = useState(false);
  const [openConvoUserId, setOpenConvoUserId]     = useState(null);
  const [dots, setDots]                           = useState({});
  const menuRef                                   = useRef(null);

  const checkNotifications = useCallback(() => {
    if (!currentUser) return;
    apiFetch('/messaging/')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const hasUnread = Array.isArray(data) && data.some(c => c.unread_count > 0);
        setDots(prev => ({ ...prev, Messages: hasUnread }));
      })
      .catch(() => {});

    apiFetch('/bookings/')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (!Array.isArray(data)) return;
        const hasNew = data.some(b =>
          (b.viewer_role === 'provider' && b.status === 'pending') ||
          (b.viewer_role === 'requester' && (b.status === 'confirmed' || b.status === 'delivered'))
        );
        setDots(prev => ({ ...prev, Bookings: hasNew }));
      })
      .catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    checkNotifications();
    const id = setInterval(checkNotifications, 30000);
    return () => clearInterval(id);
  }, [checkNotifications]);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const displayName = currentUser
    ? (currentUser.first_name || currentUser.username)
    : 'Guest';

  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function navigate(key) {
    setSelectedServiceID(null);
    setPayingBooking(null);
    setActive(key);
    setDots(prev => ({ ...prev, [key]: false }));
  }

  return (
    <div style={s.shell}>

      <header style={s.nav}>

        <div style={s.logo}>
          <span style={{ fontWeight: 400 }}>peer</span>
          <span style={{ color: colors.violet }}>·</span>
          <span style={{ fontWeight: 700 }}>market</span>
        </div>

        <nav style={s.links}>
          {navItems.map(({ label, key }) => (
            <button
              key={key}
              style={{
                ...s.link,
                ...(active === key && !selectedServiceID ? s.linkActive : {}),
              }}
              onClick={() => navigate(key)}
            >
              <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                {label}
                {dots[key] && active !== key && (
                  <span style={s.notifDot} />
                )}
              </span>
              {active === key && !selectedServiceID && <span style={s.activeDot} />}
            </button>
          ))}
        </nav>

        <div style={s.rightSlot}>
          <button style={s.offerBtn} onClick={() => onStartOnboarding?.()}>
            + Offer a service
          </button>

          <div style={s.divider} />

          <div style={s.userChip} ref={menuRef}>
            <div style={s.userTrigger} onClick={() => setMenuOpen(o => !o)}>
              <div style={s.avatar}>{initials}</div>
              <span style={s.userName}>{displayName}</span>
              <span style={{ ...s.chevron, transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
            </div>

            {menuOpen && (
              <div style={s.dropdown}>
                <button style={s.dropItem} onClick={() => { navigate('Profile Overview'); setMenuOpen(false); }}>
                  Profile
                </button>
                <button style={s.dropItem} onClick={() => { navigate('Settings'); setMenuOpen(false); }}>
                  Settings
                </button>
                <button style={s.dropItem} onClick={() => { navigate('Wallet'); setMenuOpen(false); }}>
                  Wallet
                </button>
                <div style={s.dropDivider} />
                <button style={{ ...s.dropItem, color: '#ef4444' }} onClick={() => { setMenuOpen(false); onLogout?.(); }}>
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

      </header>

      <main style={s.main}>
        {selectedServiceID != null ? (
          <ServicePage
            id={selectedServiceID}
            currentUser={currentUser}
            onBack={() => setSelectedServiceID(null)}
            onBooked={() => {
              setSelectedServiceID(null);
              setActive('Bookings');
            }}
          />
        ) : payingBooking != null ? (
          <PaymentPage
            booking={payingBooking}
            onSuccess={() => { setPayingBooking(null); setActive('Bookings'); }}
            onCancel={() => setPayingBooking(null)}
            onAddFunds={() => { setPayingBooking(null); setActive('Wallet'); }}
          />
        ) : (
          <>
            {active === 'Dashboard' && (
              <Dashboard
                onSelectService={setSelectedServiceID}
                onNavigate={setActive}
                onStartOnboarding={onStartOnboarding}
                currentUser={currentUser}
                servicesRefreshKey={servicesRefreshKey}
              />
            )}
            {active === 'Profile Overview' && (
              <AccountPage currentUser={currentUser} onSelectService={setSelectedServiceID} />
            )}
            {active === 'Search Services' && (
              <SearchPage
                onSelectService={setSelectedServiceID}
                servicesRefreshKey={servicesRefreshKey}
                currentUser={currentUser}
                onNavigate={setActive}
              />
            )}
            {active === 'Bookings'  && (
              <BookingsPage
                onPay={setPayingBooking}
                onNavigate={(page, userId) => {
                  if (userId) setOpenConvoUserId(userId);
                  setActive(page);
                }}
              />
            )}
            {active === 'Messages'  && (
              <MessagesPage
                openUserId={openConvoUserId}
                onConvoOpened={() => setOpenConvoUserId(null)}
              />
            )}
            {active === 'Reviews'   && <ReviewsPage  currentUser={currentUser} />}
            {active === 'Settings'  && <SettingsPage currentUser={currentUser} onLogout={onLogout} />}
            {active === 'Wallet'    && <WalletPage />}
          </>
        )}
      </main>

    </div>
  );
}

const s = {
  shell: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Poppins', sans-serif",
    overflow: 'hidden',
  },

  nav: {
    height: '54px',
    background: colors.dark,
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    padding: '0 24px',
    flexShrink: 0,
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },

  logo: {
    color: 'white',
    fontSize: '17px',
    letterSpacing: '0.4px',
    marginRight: '32px',
    flexShrink: 0,
    userSelect: 'none',
  },

  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '2px',
    flex: 1,
    overflow: 'hidden',
  },

  link: {
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: '0 12px',
    height: '54px',
    fontSize: '13px',
    fontWeight: '400',
    color: 'rgba(255,255,255,0.38)',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0',
    whiteSpace: 'nowrap',
    transition: 'color 0.15s',
  },

  linkActive: {
    color: 'white',
    fontWeight: '500',
  },

  notifDot: {
    position: 'absolute',
    top: '-4px',
    right: '-8px',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#ef4444',
    border: `1.5px solid ${colors.dark}`,
  },

  activeDot: {
    position: 'absolute',
    bottom: '0',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '18px',
    height: '2px',
    borderRadius: '2px 2px 0 0',
    background: colors.violet,
  },

  rightSlot: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0,
  },

  offerBtn: {
    background: 'none',
    border: `1px solid ${colors.violetBorder}`,
    borderRadius: '4px',
    color: colors.violet,
    fontSize: '12px',
    fontWeight: '600',
    padding: '6px 14px',
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    whiteSpace: 'nowrap',
    transition: 'border-color 0.15s, color 0.15s',
  },

  divider: {
    width: '1px',
    height: '22px',
    background: 'rgba(255,255,255,0.1)',
  },

  userChip: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${colors.purple}, ${colors.gradientEnd})`,
    color: 'white',
    fontSize: '10px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  userName: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    maxWidth: '110px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },

  userTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },

  chevron: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    lineHeight: 1,
    transition: 'transform 0.15s',
  },

  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    background: 'white',
    border: `1px solid ${colors.border}`,
    borderRadius: '4px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    minWidth: '150px',
    zIndex: 100,
    overflow: 'hidden',
  },

  dropItem: {
    display: 'block',
    width: '100%',
    background: 'none',
    border: 'none',
    padding: '11px 16px',
    fontSize: '13px',
    fontWeight: '500',
    color: colors.dark,
    cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
    textAlign: 'left',
  },

  dropDivider: {
    height: '1px',
    background: colors.border,
    margin: '0',
  },

  main: {
    flex: 1,
    background: colors.pageBg,
    overflowY: 'auto',
  },
};

export default MainPage;
