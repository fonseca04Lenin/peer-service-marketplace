import { useState } from 'react';
import SearchPage from './SearchPage';
import AccountPage from './AccountPage';
import Dashboard from './Dashboard';
import BookingsPage from './BookingsPage';
import MessagesPage from './MessagesPage';
import ReviewsPage from './ReviewsPage';

const navItems = ['Dashboard', 'Profile Overview', 'Search Services', 'Bookings', 'Messages', 'Reviews', 'Settings'];

function getInitials(name) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function MainPage({ currentUser, onLogout }) {
  const [active, setActive]               = useState('Dashboard');
  const [selectedServiceID, setSelectedServiceID] = useState(null);

  const displayName = currentUser
    ? (currentUser.first_name || currentUser.username)
    : 'Guest';
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const roleLabel = currentUser?.role === 'provider' ? 'Provider' : 'Requester';

  return (
    <div style={s.page}>

      <aside style={s.sidebar}>
        <div>
          <div style={s.logo}>
            <span style={{ fontWeight: 400 }}>peer</span>
            <span style={{ color: 'rgb(167, 139, 250)' }}>·</span>
            <span style={{ fontWeight: 700 }}>market</span>
          </div>
          <nav style={s.nav}>
            {navItems.map(item => (
              <div
                key={item}
                onClick={() => setActive(item)}
                style={{ ...s.navItem, ...(active === item ? s.navItemOn : {}) }}
              >
                {item}
              </div>
            ))}
          </nav>
        </div>
#user fields
        <div style={s.sideFooter}>
          <div style={s.userAvatar}>JD</div>
          <div>
            <p style={s.userName}>Lenin Fonseca</p>
            <p style={s.userRole}>Provider</p>
          </div>
          {onLogout && (
            <span onClick={onLogout} style={s.logoutBtn} title="Sign out">&#x2192;</span>
          )}
        </div>
      </aside>

      <main style={s.main}>
        {active === 'Dashboard' && <Dashboard onSelectService={setSelectedServiceID} onNavigate={setActive} currentUser={currentUser} />}
        {active === 'Profile Overview' && (
          <AccountPage currentUser={currentUser} onSelectService={setSelectedServiceID} />
        )}
        {active === 'Search Services' && <SearchPage onSelectService={setSelectedServiceID} />}
        {active === 'Bookings' && <BookingsPage currentUser={currentUser} />}
        {active === 'Messages' && <MessagesPage currentUser={currentUser} />}
        {active === 'Reviews' && <ReviewsPage currentUser={currentUser} />}
        {active === 'Settings' && <h1>Settings</h1>}
      </main>

    </div>
  );
}

const s = {
  page: {
    height: '100vh',
    display: 'flex',
    fontFamily: "'Poppins', sans-serif",
    overflow: 'hidden',
  },
  sidebar: {
    width: '210px',
    background: '#0f0620',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0,
    padding: '0 0 20px',
  },
  logo: {
    color: 'white',
    fontSize: '18px',
    letterSpacing: '0.5px',
    padding: '26px 22px 22px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '12px',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
  },
  navItem: {
    padding: '9px 22px',
    fontSize: '13.5px',
    color: 'rgba(255,255,255,0.38)',
    cursor: 'pointer',
    fontWeight: '400',
    borderLeft: '2px solid transparent',
  },
  navItemOn: {
    color: 'white',
    fontWeight: '500',
    borderLeft: '2px solid rgb(167, 139, 250)',
    background: 'rgba(255,255,255,0.04)',
  },
  sideFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '18px 18px 0',
    borderTop: '1px solid rgba(255,255,255,0.06)',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgb(83, 58, 253), #c4b5fd)',
    color: 'white',
    fontSize: '11px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    margin: 0,
  },
  userRole: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    margin: 0,
  },
  logoutBtn: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: '16px',
    cursor: 'pointer',
    flexShrink: 0,
    lineHeight: 1,
  },
  main: {
    flex: 1,
    background: '#f7f6ff',
    overflowY: 'auto',
  },
};

export default MainPage;
